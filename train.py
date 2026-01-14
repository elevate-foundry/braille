import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from datasets import load_dataset

def format_example(example, tokenizer):
    """Format instruction/input/output into a single Braille-native sequence."""
    # For now, we train on pure Braille output sequences
    # The model learns to predict Braille tokens autoregressively
    text = example["output"]
    return tokenizer(text, truncation=True, max_length=128, padding="max_length")

def format_instruction_example(example, tokenizer):
    """Format full instruction+input+output for instruction tuning."""
    # Instruction tuning format: model sees instruction+input, learns to generate output
    instruction = example.get("instruction", "")
    input_text = example.get("input", "")
    output = example.get("output", "")
    
    # Format: [BOS] instruction | input -> output [EOS]
    if input_text:
        full_text = f"{instruction}\n{input_text}\n{output}"
    else:
        full_text = f"{instruction}\n{output}"
    
    return tokenizer(full_text, truncation=True, max_length=256, padding="max_length")

def main():
    import sys
    stage = sys.argv[1] if len(sys.argv) > 1 else "1"
    
    if stage == "1":
        model_path = "./braille-base-0.5b"
        data_path = "./stage1_braille_alphabet.jsonl"
        output_dir = "./braille-trained"
    elif stage == "2":
        model_path = "./braille-trained"  # Continue from Stage 1
        data_path = "./stage2_braille_contractions.jsonl"
        output_dir = "./braille-trained-g2"
    elif stage == "3":
        model_path = "./braille-trained-g2"  # Continue from Stage 2
        data_path = "./stage3_instruction_tuning.jsonl"
        output_dir = "./braille-trained-instruct"
    else:
        print(f"Unknown stage: {stage}. Use 1, 2, or 3.")
        return
    
    # Stage 3 uses instruction tuning format
    use_instruction_format = (stage == "3")
    
    # Load model and tokenizer
    model = AutoModelForCausalLM.from_pretrained(model_path, dtype="auto", device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    # Ensure pad token is set
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load dataset
    dataset = load_dataset("json", data_files=data_path, split="train")
    
    # Tokenize
    if use_instruction_format:
        # Stage 3: Full instruction tuning format
        def tokenize_fn(examples):
            texts = []
            for inst, inp, out in zip(examples["instruction"], examples["input"], examples["output"]):
                if inp:
                    texts.append(f"{inst}\n{inp}\n{out}")
                else:
                    texts.append(f"{inst}\n{out}")
            return tokenizer(texts, truncation=True, max_length=256, padding="max_length")
    else:
        # Stage 1-2: Output only
        def tokenize_fn(examples):
            return tokenizer(examples["output"], truncation=True, max_length=128, padding="max_length")
    
    tokenized_dataset = dataset.map(tokenize_fn, batched=True, remove_columns=dataset.column_names)
    
    # Add labels for causal LM (labels = input_ids)
    def add_labels(examples):
        examples["labels"] = examples["input_ids"].copy()
        return examples
    
    tokenized_dataset = tokenized_dataset.map(add_labels, batched=True)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        gradient_accumulation_steps=4,
        learning_rate=5e-5,
        warmup_steps=100,
        logging_steps=50,
        save_steps=500,
        save_total_limit=2,
        bf16=False,
        fp16=False,
        report_to="none",
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
    )
    
    # Train
    print("Starting Braille-native training...")
    trainer.train()
    
    # Save final model
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Training complete. Model saved to {output_dir}/")

if __name__ == "__main__":
    main()
