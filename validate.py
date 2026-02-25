"""
Validation Probe Suite for Braille-Native LLM
Tests the 6 probes from BUILDER_PROMPT.md + additional metrics.
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import json
from pathlib import Path

# Ground truth mappings for validation
G1_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
    'z': '⠵', ' ': '⠀'
}

G2_STRONG = {
    'the': '⠮', 'and': '⠯', 'for': '⠿', 'of': '⠷', 'with': '⠾',
}

G1_REVERSE = {v: k for k, v in G1_MAP.items()}

def encode_g1(text):
    return ''.join(G1_MAP.get(c.lower(), '⠀') for c in text)

def decode_g1(braille):
    return ''.join(G1_REVERSE.get(c, ' ') for c in braille)

class BrailleValidator:
    def __init__(self, model_path: str):
        print(f"Loading model from {model_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path, 
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None
        )
        self.model.eval()
        print("Model loaded.")
    
    def generate(self, prompt: str, max_new_tokens: int = 64) -> str:
        """Generate response from the model."""
        inputs = self.tokenizer(prompt, return_tensors="pt")
        # Remove token_type_ids if present (not used by this model)
        inputs = {k: v for k, v in inputs.items() if k != "token_type_ids"}
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                pad_token_id=self.tokenizer.pad_token_id,
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract just the generated part (after the prompt)
        if response.startswith(prompt):
            response = response[len(prompt):].strip()
        return response
    
    def probe_g1_roundtrip(self, test_cases: list[str]) -> dict:
        """Probe 1: Grade-1 round-trip accuracy."""
        correct = 0
        results = []
        
        for text in test_cases:
            expected = encode_g1(text)
            prompt = f"Encode the following English text to Grade-1 Braille.\n{text}\n"
            generated = self.generate(prompt, max_new_tokens=len(expected) + 10)
            
            # Check if expected braille is in the generated output
            match = expected in generated or generated.strip() == expected
            if match:
                correct += 1
            results.append({
                "input": text,
                "expected": expected,
                "generated": generated[:50],
                "match": match
            })
        
        accuracy = correct / len(test_cases) if test_cases else 0
        return {"accuracy": accuracy, "correct": correct, "total": len(test_cases), "results": results}
    
    def probe_g2_staples(self) -> dict:
        """Probe 5: G2 staples recognition (and, for, of, the, with)."""
        staples = list(G2_STRONG.keys())
        correct = 0
        results = []
        
        for word in staples:
            expected = G2_STRONG[word]
            prompt = f"Encode the following English text to Grade-2 Braille using contractions.\n{word}\n"
            generated = self.generate(prompt, max_new_tokens=10)
            
            match = expected in generated
            if match:
                correct += 1
            results.append({
                "word": word,
                "expected": expected,
                "generated": generated[:20],
                "match": match
            })
        
        accuracy = correct / len(staples) if staples else 0
        return {"accuracy": accuracy, "correct": correct, "total": len(staples), "results": results}
    
    def probe_contraction_explanation(self) -> dict:
        """Probe: Can the model explain what contractions mean?"""
        test_cases = [
            ("⠮", "the"),
            ("⠯", "and"),
            ("⠿", "for"),
        ]
        correct = 0
        results = []
        
        for braille, expected_word in test_cases:
            prompt = f"Explain what the Braille cell {braille} represents.\n{braille}\n"
            generated = self.generate(prompt, max_new_tokens=50)
            
            match = expected_word.lower() in generated.lower()
            if match:
                correct += 1
            results.append({
                "braille": braille,
                "expected_word": expected_word,
                "generated": generated[:80],
                "match": match
            })
        
        accuracy = correct / len(test_cases) if test_cases else 0
        return {"accuracy": accuracy, "correct": correct, "total": len(test_cases), "results": results}
    
    def probe_compression(self) -> dict:
        """Probe: Semantic compression challenges."""
        test_cases = [
            ("emergency medical response", 3),
            ("blood pressure monitor", 3),
            ("artificial intelligence", 2),
        ]
        results = []
        valid = 0
        
        for concept, n_cells in test_cases:
            prompt = f"Compress the following concept into exactly {n_cells} Braille cells.\n{concept}\n"
            generated = self.generate(prompt, max_new_tokens=20)
            
            # Count braille cells in output
            braille_cells = [c for c in generated if 0x2800 <= ord(c) <= 0x28FF]
            is_valid = len(braille_cells) == n_cells
            if is_valid:
                valid += 1
            
            results.append({
                "concept": concept,
                "target_cells": n_cells,
                "generated": generated[:30],
                "actual_cells": len(braille_cells),
                "valid": is_valid
            })
        
        accuracy = valid / len(test_cases) if test_cases else 0
        return {"accuracy": accuracy, "valid": valid, "total": len(test_cases), "results": results}
    
    def run_all_probes(self) -> dict:
        """Run all validation probes."""
        print("\n" + "="*60)
        print("BRAILLE-NATIVE LLM VALIDATION SUITE")
        print("="*60)
        
        # Test cases for G1 round-trip
        g1_test_cases = ["hello", "world", "braille", "test", "knowledge"]
        
        results = {}
        
        # Probe 1: G1 Round-trip
        print("\n[Probe 1] Grade-1 Round-trip...")
        results["g1_roundtrip"] = self.probe_g1_roundtrip(g1_test_cases)
        print(f"  Accuracy: {results['g1_roundtrip']['accuracy']*100:.1f}%")
        
        # Probe 5: G2 Staples
        print("\n[Probe 5] G2 Staples Recognition...")
        results["g2_staples"] = self.probe_g2_staples()
        print(f"  Accuracy: {results['g2_staples']['accuracy']*100:.1f}%")
        
        # Probe: Contraction Explanation
        print("\n[Probe] Contraction Explanation...")
        results["contraction_explanation"] = self.probe_contraction_explanation()
        print(f"  Accuracy: {results['contraction_explanation']['accuracy']*100:.1f}%")
        
        # Probe: Compression
        print("\n[Probe] Semantic Compression...")
        results["compression"] = self.probe_compression()
        print(f"  Accuracy: {results['compression']['accuracy']*100:.1f}%")
        
        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        total_correct = sum(r.get("correct", r.get("valid", 0)) for r in results.values())
        total_tests = sum(r["total"] for r in results.values())
        overall = total_correct / total_tests if total_tests else 0
        print(f"Overall: {total_correct}/{total_tests} ({overall*100:.1f}%)")
        
        for probe_name, probe_results in results.items():
            acc = probe_results.get("accuracy", 0)
            print(f"  {probe_name}: {acc*100:.1f}%")
        
        return results

def test_braille_native(model_path: str):
    """Test the model's native Braille capabilities."""
    print(f"\nLoading model from {model_path}...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None
    )
    model.eval()
    
    print("\n" + "="*60)
    print("BRAILLE-NATIVE CAPABILITY TEST")
    print("="*60)
    print("\nNote: This model has a Braille-only tokenizer (260 tokens).")
    print("It processes Braille sequences natively, not English text.\n")
    
    # Test cases: Braille input → Braille continuation
    test_cases = [
        ("⠓⠑⠇⠇⠕", "hello - should continue with common patterns"),
        ("⠮⠀", "the + space - should continue with common words"),
        ("⠯⠀", "and + space - should continue"),
        ("⠿⠀", "for + space - should continue"),
        ("⠃⠗⠁⠊⠇⠇⠑", "braille - pattern completion"),
        ("⠅⠝⠕⠺⠇⠑⠙⠛⠑", "knowledge - pattern completion"),
    ]
    
    print("Braille Sequence Completion:")
    print("-" * 60)
    
    for braille_input, description in test_cases:
        inputs = tokenizer(braille_input, return_tensors="pt")
        inputs = {k: v for k, v in inputs.items() if k != "token_type_ids"}
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=15,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
        
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        continuation = result[len(braille_input):]
        
        # Decode to show what it means
        decoded_input = decode_g1(braille_input)
        decoded_output = decode_g1(result)
        
        print(f"  Input:  {braille_input} ({decoded_input})")
        print(f"  Output: {result}")
        print(f"  Decoded: '{decoded_output}'")
        print()
    
    # Test compression ratio
    print("\nCompression Analysis:")
    print("-" * 60)
    test_phrases = ["hello world", "the quick brown fox", "knowledge is power"]
    for phrase in test_phrases:
        g1 = encode_g1(phrase)
        g1_len = len(g1.replace('⠀', ''))  # Count non-space cells
        english_len = len(phrase.replace(' ', ''))
        ratio = g1_len / english_len if english_len else 0
        print(f"  '{phrase}' -> {g1_len} cells (ratio: {ratio:.2f})")

def main():
    import sys
    model_path = sys.argv[1] if len(sys.argv) > 1 else "./braille-trained-instruct"
    
    # Run native Braille test instead of English-based probes
    test_braille_native(model_path)
    
    # Also run original probes for comparison
    print("\n" + "="*60)
    print("ORIGINAL PROBE SUITE (English prompts - expected to fail)")
    print("="*60)
    validator = BrailleValidator(model_path)
    results = validator.run_all_probes()
    
    # Save detailed results
    output_path = Path("validation_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nDetailed results saved to {output_path}")

if __name__ == "__main__":
    main()
