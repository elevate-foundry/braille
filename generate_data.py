import json
import random

# Ground Truth Grade-1 Mapping
G1_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    ' ': '⠀', '.': '⠲', ',': '⠂', '!': '⠖', '?': '⠦', '-': '⠤'
}

# Grade-2 Whole Word Contractions (alphabetic wordsigns)
# These single letters represent whole words when standing alone
G2_WORDSIGNS = {
    'but': '⠃', 'can': '⠉', 'do': '⠙', 'every': '⠑', 'from': '⠋',
    'go': '⠛', 'have': '⠓', 'just': '⠚', 'knowledge': '⠅', 'like': '⠇',
    'more': '⠍', 'not': '⠝', 'people': '⠏', 'quite': '⠟', 'rather': '⠗',
    'so': '⠎', 'that': '⠞', 'us': '⠥', 'very': '⠧', 'will': '⠺',
    'it': '⠭', 'you': '⠽', 'as': '⠵'
}

# Grade-2 Strong Contractions (one-cell whole words)
G2_STRONG = {
    'the': '⠮', 'and': '⠯', 'for': '⠿', 'of': '⠷', 'with': '⠾',
    'child': '⠡', 'shall': '⠩', 'this': '⠹', 'which': '⠱', 'out': '⠳',
    'still': '⠌'
}

# Grade-2 Strong Groupsigns (can appear within words)
G2_GROUPSIGNS = {
    'ch': '⠡', 'gh': '⠣', 'sh': '⠩', 'th': '⠹', 'wh': '⠱',
    'ed': '⠫', 'er': '⠻', 'ou': '⠳', 'ow': '⠪', 'st': '⠌',
    'ar': '⠜', 'ing': '⠬', 'ble': '⠼'
}

# Grade-2 Lower Wordsigns (dots 2-3-4-5-6 patterns)
G2_LOWER = {
    'be': '⠆', 'enough': '⠢', 'were': '⠶', 'his': '⠦', 'in': '⠔',
    'was': '⠴', 'to': '⠖', 'into': '⠔⠖', 'by': '⠃⠽'
}

# Common words for training variety
COMMON_WORDS = [
    'the', 'and', 'for', 'with', 'that', 'have', 'this', 'will', 'from',
    'they', 'which', 'their', 'would', 'there', 'could', 'people', 'about',
    'know', 'just', 'like', 'time', 'very', 'when', 'come', 'make', 'than',
    'child', 'children', 'shall', 'should', 'through', 'think', 'thought',
    'knowledge', 'enough', 'every', 'everything', 'everyone', 'rather',
    'together', 'another', 'mother', 'father', 'brother', 'other'
]

def to_braille_g1(text):
    """Grade-1: Pure letter-by-letter translation."""
    return "".join(G1_MAP.get(c.lower(), '⠀') for c in text)

def to_braille_g2(text):
    """Grade-2: Apply contractions for compression."""
    text = text.lower()
    words = text.split(' ')
    result = []
    
    for word in words:
        # Check whole word contractions first (highest priority)
        if word in G2_STRONG:
            result.append(G2_STRONG[word])
        elif word in G2_WORDSIGNS:
            result.append(G2_WORDSIGNS[word])
        elif word in G2_LOWER:
            result.append(G2_LOWER[word])
        else:
            # Apply groupsigns within the word
            contracted = word
            # Sort by length descending to match longest patterns first
            for pattern, braille in sorted(G2_GROUPSIGNS.items(), key=lambda x: -len(x[0])):
                contracted = contracted.replace(pattern, braille)
            # Convert remaining letters with G1
            final = ""
            for c in contracted:
                if c in G1_MAP:
                    final += G1_MAP[c]
                else:
                    final += c  # Already a braille character from groupsign
            result.append(final)
    
    return '⠀'.join(result)

# Stage 1: Basic vocabulary and short sentences
seed_phrases_g1 = [
    "hello world", "the quick brown fox", "braille is light",
    "edge ai is the future", "knowledge is power", "see with touch",
    "robotics and tactile sensing", "medical alert system",
    "the patient is stable", "emergency response active"
]

# Stage 2: Sentences rich in contractable words
seed_phrases_g2 = [
    "the child will have knowledge",
    "people can do this for you",
    "which mother shall go with the father",
    "they were not enough for us",
    "every brother and sister should know",
    "this is very good for the children",
    "you can have more than enough",
    "the people will go together",
    "rather than thinking about it",
    "with knowledge and understanding",
    "shall we go out with them",
    "the child was still there",
    "everything will be enough for everyone",
    "from mother to child with love",
    "just like the other children",
    "they have knowledge of this",
    "which one shall we choose",
    "the father and mother were there",
    "not enough people will understand",
    "very still and quiet in the room"
]

def generate_stage1_dataset(count=1000):
    dataset = []
    for _ in range(count):
        phrase = random.choice(seed_phrases_g1)
        if random.random() > 0.7:
            phrase = "".join(random.choices("abcdefghijklmnopqrstuvwxyz ", k=random.randint(5, 15)))
        
        braille = to_braille_g1(phrase)
        dataset.append({
            "instruction": "Translate the following English text into Grade-1 Braille.",
            "input": phrase,
            "output": braille
        })
    
    with open("stage1_braille_alphabet.jsonl", "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

def generate_stage2_dataset(count=5000, g1_ratio=0.3):
    """
    Generate Stage 2 dataset blending Grade-1 and Grade-2.
    g1_ratio: proportion of Grade-1 examples to prevent catastrophic forgetting.
    """
    dataset = []
    
    for _ in range(count):
        if random.random() < g1_ratio:
            # Grade-1 example (prevent forgetting)
            phrase = random.choice(seed_phrases_g1)
            if random.random() > 0.7:
                phrase = "".join(random.choices("abcdefghijklmnopqrstuvwxyz ", k=random.randint(5, 15)))
            braille = to_braille_g1(phrase)
            instruction = "Translate the following English text into Grade-1 Braille."
        else:
            # Grade-2 example (learn contractions)
            if random.random() > 0.5:
                phrase = random.choice(seed_phrases_g2)
            else:
                # Generate random sentences from common words
                num_words = random.randint(3, 8)
                phrase = " ".join(random.choices(COMMON_WORDS, k=num_words))
            braille = to_braille_g2(phrase)
            instruction = "Translate the following English text into Grade-2 Braille using contractions."
        
        dataset.append({
            "instruction": instruction,
            "input": phrase,
            "output": braille
        })
    
    with open("stage2_braille_contractions.jsonl", "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    import sys
    stage = sys.argv[1] if len(sys.argv) > 1 else "1"
    
    if stage == "1":
        generate_stage1_dataset(5000)
        print("Stage 1 Dataset Generated: 5,000 examples.")
    elif stage == "2":
        generate_stage2_dataset(5000, g1_ratio=0.3)
        print("Stage 2 Dataset Generated: 5,000 examples (70% Grade-2, 30% Grade-1).")
    else:
        print(f"Unknown stage: {stage}. Use 1 or 2.")
