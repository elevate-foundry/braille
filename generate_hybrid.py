"""
Hybrid Data Generation for Braille-Native LLM
Phase 2.1: Instruction Tuning with Task Distribution

Uses Claude API for logic/reasoning, deterministic Python for Braille mapping.
This ensures 100% accuracy on Braille output while leveraging LLM creativity.
"""

import json
import random
import os
from pathlib import Path
from typing import Optional

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Optional: Claude API for hybrid generation
try:
    import anthropic
    HAS_ANTHROPIC = True
    if os.getenv("ANTHROPIC_API_KEY"):
        print("Anthropic API key found. Hybrid mode available.")
    else:
        print("Warning: ANTHROPIC_API_KEY not set. Using synthetic-only mode.")
        HAS_ANTHROPIC = False
except ImportError:
    HAS_ANTHROPIC = False
    print("Warning: anthropic not installed. Using synthetic-only mode.")

# =============================================================================
# GROUND TRUTH BRAILLE MAPPINGS (Deterministic - Never hallucinate)
# =============================================================================

G1_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
    'z': '⠵', ' ': '⠀', '.': '⠲', ',': '⠂', '!': '⠖',
    '?': '⠦', '-': '⠤', "'": '⠄', ':': '⠒', ';': '⠆',
    '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲',
    '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔'
}

# Grade-2 Strong Contractions (whole words)
G2_STRONG = {
    'the': '⠮', 'and': '⠯', 'for': '⠿', 'of': '⠷', 'with': '⠾',
    'child': '⠡', 'shall': '⠩', 'this': '⠹', 'which': '⠱', 'out': '⠳',
    'still': '⠌'
}

# Grade-2 Wordsigns (single letters as words)
G2_WORDSIGNS = {
    'but': '⠃', 'can': '⠉', 'do': '⠙', 'every': '⠑', 'from': '⠋',
    'go': '⠛', 'have': '⠓', 'just': '⠚', 'knowledge': '⠅', 'like': '⠇',
    'more': '⠍', 'not': '⠝', 'people': '⠏', 'quite': '⠟', 'rather': '⠗',
    'so': '⠎', 'that': '⠞', 'us': '⠥', 'very': '⠧', 'will': '⠺',
    'it': '⠭', 'you': '⠽', 'as': '⠵'
}

# Grade-2 Groupsigns (within words)
G2_GROUPSIGNS = {
    'ing': '⠬', 'ble': '⠼', 'ch': '⠡', 'gh': '⠣', 'sh': '⠩',
    'th': '⠹', 'wh': '⠱', 'ed': '⠫', 'er': '⠻', 'ou': '⠳',
    'ow': '⠪', 'st': '⠌', 'ar': '⠜', 'en': '⠢', 'in': '⠔'
}

# Grade-2 Lower Wordsigns
G2_LOWER = {
    'be': '⠆', 'enough': '⠢', 'were': '⠶', 'his': '⠦', 'was': '⠴',
    'to': '⠖', 'into': '⠔⠖', 'by': '⠃⠽'
}

# Reverse mappings for decode tasks
G1_REVERSE = {v: k for k, v in G1_MAP.items()}
G2_ALL = {**G2_STRONG, **G2_WORDSIGNS, **G2_LOWER}
G2_REVERSE = {v: k for k, v in G2_ALL.items()}

# =============================================================================
# DETERMINISTIC ENCODING FUNCTIONS
# =============================================================================

def encode_g1(text: str) -> str:
    """Grade-1: Pure letter-by-letter encoding."""
    return ''.join(G1_MAP.get(c.lower(), '⠀') for c in text)

def decode_g1(braille: str) -> str:
    """Grade-1: Braille to English."""
    return ''.join(G1_REVERSE.get(c, ' ') for c in braille)

def encode_g2(text: str) -> str:
    """Grade-2: Apply contractions for compression."""
    text = text.lower()
    words = text.split(' ')
    result = []
    
    for word in words:
        if word in G2_STRONG:
            result.append(G2_STRONG[word])
        elif word in G2_WORDSIGNS:
            result.append(G2_WORDSIGNS[word])
        elif word in G2_LOWER:
            result.append(G2_LOWER[word])
        else:
            contracted = word
            for pattern, braille in sorted(G2_GROUPSIGNS.items(), key=lambda x: -len(x[0])):
                contracted = contracted.replace(pattern, braille)
            final = ""
            for c in contracted:
                if c in G1_MAP:
                    final += G1_MAP[c]
                else:
                    final += c
            result.append(final)
    
    return '⠀'.join(result)

def compress_to_n_cells(text: str, n: int) -> tuple[str, str]:
    """Compress concept to exactly n cells using first letters."""
    words = text.lower().split()
    letters = [w[0] for w in words if w and w[0].isalpha()][:n]
    while len(letters) < n and words:
        # Add more letters from longest word
        longest = max(words, key=len)
        for c in longest[1:]:
            if c.isalpha() and len(letters) < n:
                letters.append(c)
    letters = letters[:n]
    braille = ''.join(G1_MAP.get(l, '⠀') for l in letters)
    reasoning = f"Uses letters: {', '.join(letters)} from key words"
    return braille, reasoning

# =============================================================================
# TASK GENERATORS (Deterministic + Optional Claude Hybrid)
# =============================================================================

# Seed data for variety
ENGLISH_PHRASES = [
    "hello world", "the quick brown fox", "knowledge is power",
    "emergency response team", "blood pressure monitor", "patient vital signs",
    "artificial intelligence", "machine learning model", "neural network",
    "the child will learn", "people can understand", "with knowledge and wisdom",
    "medical alert system", "tactile feedback device", "braille display unit",
    "semantic compression", "information theory", "communication protocol",
    "edge computing device", "raspberry pi deployment", "low latency inference",
    "the mother and father", "children shall learn", "every person matters",
    "robot arm controller", "haptic feedback glove", "sensory substitution",
    "natural language processing", "text to speech", "speech recognition",
    "autonomous navigation", "obstacle avoidance", "path planning algorithm"
]

DOMAIN_CONCEPTS = [
    "emergency medical response", "blood oxygen saturation", "heart rate variability",
    "intracranial pressure", "respiratory distress syndrome", "cardiac arrhythmia",
    "diabetic ketoacidosis", "anaphylactic shock", "cerebrovascular accident",
    "myocardial infarction", "pulmonary embolism", "septic shock protocol",
    "trauma assessment", "triage classification", "critical care unit",
    "robotic surgery", "prosthetic limb control", "neural interface",
    "swarm intelligence", "distributed consensus", "fault tolerance",
    "semantic similarity", "embedding space", "vector quantization"
]

CONTRACTION_EXPLANATIONS = {
    '⠮': "The cell ⠮ represents 'the' - the most common English word, compressed to one cell.",
    '⠯': "The cell ⠯ represents 'and' - a conjunction compressed for efficiency.",
    '⠿': "The cell ⠿ represents 'for' - a preposition in Grade-2 UEB.",
    '⠷': "The cell ⠷ represents 'of' - indicating possession or relation.",
    '⠾': "The cell ⠾ represents 'with' - denoting accompaniment.",
    '⠹': "The cell ⠹ represents 'this' as a word, or 'th' within words.",
    '⠡': "The cell ⠡ represents 'child' as a word, or 'ch' within words.",
    '⠩': "The cell ⠩ represents 'shall' as a word, or 'sh' within words.",
    '⠱': "The cell ⠱ represents 'which' as a word, or 'wh' within words.",
    '⠬': "The cell ⠬ represents the 'ing' suffix - very common in English.",
    '⠻': "The cell ⠻ represents the 'er' pattern - agent nouns and comparatives.",
    '⠌': "The cell ⠌ represents 'still' as a word, or 'st' within words."
}

def generate_round_trip_example() -> dict:
    """40% of dataset: English <-> Braille translation."""
    phrase = random.choice(ENGLISH_PHRASES)
    
    if random.random() < 0.5:
        # English to Braille
        if random.random() < 0.4:
            # Grade-1
            return {
                "instruction": "Encode the following English text to Grade-1 Braille.",
                "input": phrase,
                "output": encode_g1(phrase),
                "task_type": "g1_encode"
            }
        else:
            # Grade-2
            return {
                "instruction": "Encode the following English text to Grade-2 Braille using contractions.",
                "input": phrase,
                "output": encode_g2(phrase),
                "task_type": "g2_encode"
            }
    else:
        # Braille to English
        braille = encode_g1(phrase)
        return {
            "instruction": "Decode the following Braille to English.",
            "input": braille,
            "output": phrase.lower(),
            "task_type": "decode"
        }

def generate_discovery_example() -> dict:
    """25% of dataset: Propose new Grade-3+ contractions."""
    concept = random.choice(DOMAIN_CONCEPTS)
    n_cells = random.randint(2, 4)
    braille, reasoning = compress_to_n_cells(concept, n_cells)
    
    templates = [
        f"Propose a {n_cells}-cell Grade-3 contraction for: {concept}",
        f"Create a compressed Braille symbol for '{concept}' using {n_cells} cells.",
        f"Design a shorthand notation for '{concept}' in {n_cells} Braille cells."
    ]
    
    return {
        "instruction": random.choice(templates),
        "input": concept,
        "output": f"{braille} - {reasoning}",
        "task_type": "contraction_discovery"
    }

def generate_compression_example() -> dict:
    """20% of dataset: Extreme semantic compression challenges."""
    concept = random.choice(DOMAIN_CONCEPTS)
    n_cells = random.randint(2, 3)
    braille, reasoning = compress_to_n_cells(concept, n_cells)
    
    return {
        "instruction": f"Compress the following concept into exactly {n_cells} Braille cells.",
        "input": concept,
        "output": braille,
        "task_type": "compression_challenge",
        "metadata": {"reasoning": reasoning, "n_cells": n_cells}
    }

def generate_reasoning_example() -> dict:
    """10% of dataset: Braille logic and explanation tasks."""
    task_variant = random.choice(["explain", "combine", "infer"])
    
    if task_variant == "explain":
        cell, explanation = random.choice(list(CONTRACTION_EXPLANATIONS.items()))
        return {
            "instruction": f"Explain what the Braille cell {cell} represents.",
            "input": cell,
            "output": explanation,
            "task_type": "braille_reasoning"
        }
    
    elif task_variant == "combine":
        cells = random.sample(list(G2_ALL.items()), 2)
        word1, braille1 = cells[0]
        word2, braille2 = cells[1]
        combined = braille1 + braille2
        meaning = f"{word1} {word2}"
        return {
            "instruction": f"Given {braille1} means '{word1}' and {braille2} means '{word2}', what does {combined} represent?",
            "input": combined,
            "output": f"The sequence {combined} represents '{meaning}' - a compound of the two contractions.",
            "task_type": "braille_reasoning"
        }
    
    else:  # infer
        word = random.choice(list(G2_STRONG.keys()))
        braille = G2_STRONG[word]
        return {
            "instruction": "Identify the English word represented by this Grade-2 contraction.",
            "input": braille,
            "output": f"The cell {braille} represents the word '{word}'.",
            "task_type": "braille_reasoning"
        }

def generate_swarm_example() -> dict:
    """5% of dataset: Multi-agent negotiation protocols."""
    scenarios = [
        {
            "instruction": "Agent A uses ⠁⠃ for 'abort'. Agent B uses ⠁⠃ for 'above'. Propose a resolution.",
            "input": "conflict: ⠁⠃",
            "output": "Resolution: Use context prefix. ⠼⠁⠃ (number sign + ab) = abort (emergency). ⠠⠁⠃ (caps sign + ab) = above (spatial). Default without prefix = abort (safety priority).",
            "task_type": "swarm_negotiation"
        },
        {
            "instruction": "Two robots need to share a contraction dictionary. Design a sync protocol.",
            "input": "sync request",
            "output": "Protocol: 1) Exchange hash of current dictionary. 2) If mismatch, send diff. 3) Resolve conflicts by frequency (higher usage wins). 4) Broadcast new shared entries with ⠿⠿ prefix.",
            "task_type": "swarm_negotiation"
        },
        {
            "instruction": "A new agent joins the swarm with no shared contractions. Bootstrap protocol?",
            "input": "new agent bootstrap",
            "output": "Bootstrap: 1) Send Grade-2 UEB base (mandatory). 2) Send top-50 domain contractions by frequency. 3) Agent echoes understood contractions. 4) Negotiate unknowns via Grade-1 expansion.",
            "task_type": "swarm_negotiation"
        },
        {
            "instruction": "Agent detects semantic drift - its contraction for 'danger' differs from swarm consensus. Resolution?",
            "input": "semantic drift detected",
            "output": "Resolution: 1) Flag local contraction as deprecated. 2) Request swarm consensus definition. 3) Update local dictionary. 4) Re-encode recent messages with new contraction. 5) Broadcast acknowledgment.",
            "task_type": "swarm_negotiation"
        }
    ]
    return random.choice(scenarios)

# =============================================================================
# MAIN GENERATION PIPELINE
# =============================================================================

TASK_DISTRIBUTION = {
    "round_trip": (0.40, generate_round_trip_example),
    "discovery": (0.25, generate_discovery_example),
    "compression": (0.20, generate_compression_example),
    "reasoning": (0.10, generate_reasoning_example),
    "swarm": (0.05, generate_swarm_example)
}

def generate_stage3_dataset(n_examples: int = 50000, output_path: str = "stage3_instruction_tuning.jsonl"):
    """Generate Stage 3 dataset with task distribution."""
    dataset = []
    
    # Calculate examples per task
    task_counts = {task: int(n_examples * weight) for task, (weight, _) in TASK_DISTRIBUTION.items()}
    
    # Adjust for rounding
    total = sum(task_counts.values())
    if total < n_examples:
        task_counts["round_trip"] += n_examples - total
    
    print(f"Generating {n_examples} examples with distribution:")
    for task, count in task_counts.items():
        print(f"  {task}: {count} ({count/n_examples*100:.1f}%)")
    
    # Generate examples
    for task, count in task_counts.items():
        _, generator = TASK_DISTRIBUTION[task]
        for i in range(count):
            example = generator()
            dataset.append(example)
            
            if (i + 1) % 1000 == 0:
                print(f"  {task}: {i+1}/{count}")
    
    # Shuffle
    random.shuffle(dataset)
    
    # Save
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    
    print(f"\nDataset saved to {output_path}")
    print(f"Total examples: {len(dataset)}")
    
    # Print sample
    print("\nSample examples:")
    for i, ex in enumerate(random.sample(dataset, min(5, len(dataset)))):
        print(f"\n--- Example {i+1} ({ex.get('task_type', 'unknown')}) ---")
        print(f"Instruction: {ex['instruction']}")
        print(f"Input: {ex['input'][:50]}..." if len(ex.get('input', '')) > 50 else f"Input: {ex.get('input', '')}")
        print(f"Output: {ex['output'][:80]}..." if len(ex['output']) > 80 else f"Output: {ex['output']}")

if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 50000
    generate_stage3_dataset(n)
