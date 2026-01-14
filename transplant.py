import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = 'Qwen/Qwen2.5-0.5B'
tokenizer_path = './braille-tokenizer'

# 1. Load the small base model
model = AutoModelForCausalLM.from_pretrained(model_name, dtype='auto', device_map='auto')
tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)

# 2. Resize embeddings to 260
# This shrinks the input and output matrices to ONLY handle our Braille tokens
model.resize_token_embeddings(len(tokenizer))

# 3. Save this 'Ready-for-Braille' base
model.save_pretrained('./braille-base-0.5b')
tokenizer.save_pretrained('./braille-base-0.5b')

print('Transplant complete. Model is now Braille-native and ready for training.')
