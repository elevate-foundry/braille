"""
Modal deployment for Braille-Native LLM training.
Run with: modal run modal_train.py
"""

import modal
from pathlib import Path

LOCAL_DIR = Path("/home/owner/CascadeProjects/braille")

# Define the image with all dependencies
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch",
    "transformers",
    "accelerate",
    "datasets",
    "tokenizers",
)

app = modal.App("braille-native-training")

# Volume to persist trained model and upload data
volume = modal.Volume.from_name("braille-models", create_if_missing=True)

@app.function(image=image, volumes={"/data": volume})
def upload_files():
    """Upload local files to Modal volume."""
    import os
    os.makedirs("/data/braille", exist_ok=True)
    return "Ready for upload"

@app.function(
    image=image,
    gpu="A100",  # or "A10G" for cheaper, "H100" for fastest
    timeout=7200,  # 2 hours max
    volumes={"/data": volume},
)
def train_stage3(model_files: dict, dataset_content: str):
    import os
    import json
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
    from datasets import Dataset
    
    work_dir = "/data/braille"
    os.makedirs(work_dir, exist_ok=True)
    os.chdir(work_dir)
    
    # Write model files
    model_dir = f"{work_dir}/model"
    os.makedirs(model_dir, exist_ok=True)
    for filename, content in model_files.items():
        filepath = f"{model_dir}/{filename}"
        if isinstance(content, bytes):
            with open(filepath, "wb") as f:
                f.write(content)
        else:
            with open(filepath, "w") as f:
                f.write(content)
    
    # Write dataset
    data_path = f"{work_dir}/dataset.jsonl"
    with open(data_path, "w") as f:
        f.write(dataset_content)
    
    output_dir = f"{work_dir}/output"
    
    print(f"Loading model from {model_dir}")
    model = AutoModelForCausalLM.from_pretrained(model_dir, torch_dtype=torch.bfloat16, device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print(f"Loading dataset from {data_path}")
    # Load JSONL manually
    data = []
    with open(data_path, "r") as f:
        for line in f:
            data.append(json.loads(line))
    dataset = Dataset.from_list(data)
    
    def tokenize_fn(examples):
        texts = []
        for inst, inp, out in zip(examples["instruction"], examples["input"], examples["output"]):
            if inp:
                texts.append(f"{inst}\n{inp}\n{out}")
            else:
                texts.append(f"{inst}\n{out}")
        return tokenizer(texts, truncation=True, max_length=256, padding="max_length")
    
    tokenized_dataset = dataset.map(tokenize_fn, batched=True, remove_columns=dataset.column_names)
    
    def add_labels(examples):
        examples["labels"] = examples["input_ids"].copy()
        return examples
    
    tokenized_dataset = tokenized_dataset.map(add_labels, batched=True)
    
    training_args = TrainingArguments(
        output_dir=output_dir,
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=16,  # Larger batch on A100
        gradient_accumulation_steps=2,
        learning_rate=5e-5,
        warmup_steps=100,
        logging_steps=50,
        save_steps=500,
        save_total_limit=2,
        bf16=True,  # A100 supports bf16
        report_to="none",
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
    )
    
    print("Starting training...")
    trainer.train()
    
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Training complete. Model saved to {output_dir}")
    
    volume.commit()
    
    return "Training complete!"

@app.local_entrypoint()
def main():
    import os
    
    print("Loading local files...")
    
    # Load model files
    model_dir = LOCAL_DIR / "braille-trained-g2"
    model_files = {}
    for f in model_dir.iterdir():
        if f.is_file():
            print(f"  Loading {f.name}...")
            if f.suffix in [".safetensors", ".bin"]:
                model_files[f.name] = f.read_bytes()
            else:
                model_files[f.name] = f.read_text()
    
    # Load dataset
    dataset_path = LOCAL_DIR / "stage3_instruction_tuning.jsonl"
    print(f"  Loading dataset ({dataset_path.stat().st_size / 1024 / 1024:.1f} MB)...")
    dataset_content = dataset_path.read_text()
    
    print(f"\nUploading {len(model_files)} model files + dataset to Modal...")
    print("Starting Stage 3 training on Modal A100...")
    
    result = train_stage3.remote(model_files, dataset_content)
    print(result)
