import json
from tokenizers import Tokenizer, models, pre_tokenizers, trainers
from transformers import PreTrainedTokenizerFast

def build_braille_tokenizer(save_path="braille-tokenizer"):
    # 1. Initialize a WordLevel model (treats each char as a unit)
    tokenizer = Tokenizer(models.WordLevel(unk_token="[UNK]"))
    
    # 2. Split into individual characters
    tokenizer.pre_tokenizer = pre_tokenizers.Split(pattern="", behavior="isolated")
    
    # 3. Create the vocabulary: Special tokens + 256 Braille cells
    special_tokens = ["[PAD]", "[BOS]", "[EOS]", "[UNK]"]
    braille_cells = [chr(0x2800 + i) for i in range(256)]
    vocab = {token: i for i, token in enumerate(special_tokens + braille_cells)}
    
    # Manually set the vocab into the model
    tokenizer.model = models.WordLevel(vocab=vocab, unk_token="[UNK]")
    
    # Remove spaces when decoding
    from tokenizers import decoders
    tokenizer.decoder = decoders.Fuse()
    
    # 4. Wrap in PreTrainedTokenizerFast for Transformers compatibility
    fast_tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=tokenizer,
        bos_token="[BOS]",
        eos_token="[EOS]",
        pad_token="[PAD]",
        unk_token="[UNK]",
        clean_up_tokenization_spaces=False
    )
    
    fast_tokenizer.save_pretrained(save_path)
    print(f"Tokenizer saved to {save_path}/")

if __name__ == "__main__":
    build_braille_tokenizer()
