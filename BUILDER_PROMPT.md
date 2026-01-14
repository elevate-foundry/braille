# Builder Prompt: Braille-Native LLM for Edge Deployment

## Mission

Build a small (1-3B parameter) language model that **thinks natively in braille**, trained via distillation from frontier models (Claude/GPT), and deployable on edge hardware (Raspberry Pi 5, Meta glasses, medical wearables) via llama.cpp.

This is not a translation model. The goal is a model where braille is the **primary cognitive substrate**—compression, reasoning, and communication all happen in braille space, with English as a secondary interface.

---

## Background & Thesis

### The Core Insight

Braille contractions (Grade 1 → Grade 2 → Grade 3 → ... → Grade ∞) represent a **semantic compression hierarchy**:

- **Grade 1**: Letter-by-letter (1:1 mapping, no compression)
- **Grade 2**: ~180 standard contractions (~25% compression)
- **Grade 3+**: Domain-specific shorthand (higher compression)
- **Grade ∞**: Theoretical limit—a single symbol encodes arbitrarily complex meaning

**Hypothesis**: If agents share a learned contraction dictionary, communication bandwidth approaches zero as shared context deepens. This enables "faster-than-light" semantic transmission—not breaking physics, but pre-computing meaning.

### Why Braille?

1. **Constrained vocabulary**: 64 cells (6-dot) or 256 cells (8-dot)—finite, learnable
2. **Tactile substrate**: Works for embodied AI (robots, prosthetics, wearables)
3. **Compression-native**: Grade 2+ braille already encodes morphological patterns
4. **Accessibility bridge**: Same system works for blind/deafblind users

### The Gap

Large LLMs can translate to/from braille, but they don't **think** in braille. We need a small model that:
- Represents concepts directly in braille space
- Discovers new contractions (Grade N+1) through training
- Runs offline on edge hardware
- Can negotiate shared contractions with other agents (swarm communication)

---

## Existing Work (Reference Projects)

The following projects in `/home/owner/CascadeProjects/` contain prior work:

| Project | Description | Key Files |
|---------|-------------|-----------|
| `braille/` | Web demos, BBID identity system, MongoDB integration | `js/`, `api/`, `bbid-*.html` |
| `braille-compression/` | LoRA fine-tuning pipeline for LLaMA-3-8B | `src/`, `Modelfile`, `config.py` |
| `braille-native-cctn/` | Native braille cognition experiments | - |
| `native-braille-ai/` | Web interface for braille AI | `web_interface.py`, `index.html` |
| `infinity-token/` | Swarm intelligence framework (Phases 0-5 complete) | `src/`, `app.py`, `ROADMAP.md` |
| `entangled-swarm/` | Product-of-Experts braille combiner | `braille_core/`, `Build.md` |
| `helen_keller_chip/` | Hardware: 8-bit braille logic for haptic reflexes | `firmware/`, `helen_keller_chip.py` |
| `scl/` | Semantic Compression Lattice for Hutter Prize | `scl_cmix_spe.py`, `*.pdf` |
| `semantic-compression-lattice/` | Earlier SCL work | - |

### Key Results from Prior Work

- **braille-native**: 100% accuracy, +0.332 semantic separation with hard-negative contrastive learning
- **helen_keller_chip**: 1.77µs latency (3.7x faster than NumPy neural net)
- **infinity-token**: Full simulation working, Phases 0-5 complete
- **scl**: 57% semantic ratio on Wikipedia compression

### Known Limitations

1. **Scale**: 3.4M parameter braille-native model doesn't generalize to unseen domains
2. **Data**: 10k examples insufficient; need 100k+ with harder negatives
3. **Frontier dependency**: entangled-swarm PoE combiner needs models that pass braille probes

---

## Build Specification

### Phase 1: Distillation Dataset Generation

**Goal**: Generate 100k-1M training examples using Claude/GPT-4.

#### Task Categories

1. **Round-trip translation** (40%)
   ```
   Input: "Hello, world!"
   Output: "⠓⠑⠇⠇⠕⠂ ⠺⠕⠗⠇⠙⠖"
   ```

2. **Contraction discovery** (25%)
   ```
   Prompt: "The phrase 'knowledge of the environment' appears frequently. 
            Propose a Grade-3 contraction and justify it."
   Output: "⠅⠕⠑ (k-o-e) - combines 'knowledge' (⠅) + 'of' (⠷) + 'environment' (⠑)"
   ```

3. **Semantic compression challenges** (20%)
   ```
   Prompt: "Compress this concept into exactly 3 braille cells: 
            'The patient's blood pressure is dangerously high'"
   Output: "⠃⠏⠙ (bp-danger) - blood pressure + danger indicator"
   ```

4. **Braille reasoning** (10%)
   ```
   Prompt: "Given ⠮ means 'the' and ⠿ means 'for', what would ⠮⠿ likely mean?"
   Output: "Therefore / for the reason that (compound contraction)"
   ```

5. **Swarm negotiation** (5%)
   ```
   Prompt: "Agent A uses ⠁⠃ for 'abort'. Agent B uses ⠁⠃ for 'above'. 
            Propose a resolution protocol."
   Output: "Context prefix: ⠁⠃ after ⠼ (number sign) = abort; 
            ⠁⠃ after ⠠ (caps sign) = above"
   ```

#### Data Format

```jsonl
{"instruction": "Encode to Grade-1 braille", "input": "Hello", "output": "⠓⠑⠇⠇⠕", "task_type": "g1_encode"}
{"instruction": "Propose a contraction for 'emergency response'", "input": "", "output": "⠑⠗ - combines first letters, high-frequency medical domain", "task_type": "contraction_discovery"}
```

#### Generation Script Skeleton

```python
import anthropic
import json
from pathlib import Path

client = anthropic.Anthropic()

TASK_PROMPTS = {
    "g1_encode": "Encode the following English text to Grade-1 braille. Output ONLY the braille characters.",
    "g1_decode": "Decode the following Grade-1 braille to English. Output ONLY the English text.",
    "g2_encode": "Encode using Grade-2 braille contractions where applicable.",
    "contraction_discovery": "Propose a new braille contraction for the given phrase. Explain your reasoning.",
    "compression_challenge": "Compress the given concept into exactly {n} braille cells. Justify your choice.",
    "braille_reasoning": "Given the braille symbols and their meanings, reason about the combined meaning.",
    "swarm_negotiation": "Two agents have conflicting contraction definitions. Propose a resolution.",
}

def generate_example(task_type: str, **kwargs) -> dict:
    prompt = TASK_PROMPTS[task_type].format(**kwargs)
    # ... call Claude API ...
    return {"instruction": prompt, "input": kwargs.get("input", ""), "output": response, "task_type": task_type}

def generate_dataset(output_path: Path, num_examples: int = 100_000):
    # Implement with checkpointing (save every 1000 examples)
    # Use batch API for cost efficiency
    pass
```

### Phase 2: Model Training

**Base models to consider** (in order of preference for edge deployment):

1. **Qwen 2.5 0.5B** - Smallest, fastest inference
2. **Llama 3.2 1B** - Good balance of size/capability
3. **Phi-3 Mini 3.8B** - If you have more compute budget
4. **SmolLM 1.7B** - Hugging Face's small model

**Training approach**:

1. **LoRA on embedding + LM head** (from braille-compression repo)
   - Rank: 64-128
   - Target modules: `embed_tokens`, `lm_head`
   - Don't touch attention layers initially

2. **Curriculum learning**:
   - Stage 1: Grade-1 round-trips only (10k examples)
   - Stage 2: Add Grade-2 contractions (25k examples)
   - Stage 3: Add contraction discovery (50k examples)
   - Stage 4: Full dataset with reasoning tasks

3. **Contrastive fine-tuning** (from braille-native):
   - Hard negative mining
   - InfoNCE loss for semantic separation
   - Target: positive separation > 0.3

**Training script location**: Extend `/home/owner/CascadeProjects/braille-compression/src/train/`

### Phase 3: Export & Deployment

**Export to GGUF**:

```bash
# After training, convert to GGUF
python -m llama_cpp.convert --outfile braille-native-1b.gguf ./trained_model/

# Quantize for edge
./quantize braille-native-1b.gguf braille-native-1b-q4_k_m.gguf q4_k_m
```

**Test with llama.cpp**:

```bash
./llama-cli -m braille-native-1b-q4_k_m.gguf \
  -p "Encode to Grade-2 braille: The quick brown fox" \
  --temp 0.0 -n 64
```

**Raspberry Pi 5 deployment**:

```bash
# On Pi 5 (8GB recommended)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j4

# Copy model
scp braille-native-1b-q4_k_m.gguf pi@raspberrypi:~/models/

# Run inference
./llama-server -m ~/models/braille-native-1b-q4_k_m.gguf \
  --host 0.0.0.0 --port 8080
```

### Phase 4: Validation

**Probe suite** (from entangled-swarm/Build.md):

1. **Round-trip G1**: encode→decode accuracy ≥95%
2. **Caps & number mode**: Correct mode switching
3. **Punctuation fidelity**: All standard punctuation correct
4. **Whitespace preservation**: Spaces/newlines preserved
5. **G2 staples recognition**: and, for, of, the, with
6. **Unicode echo**: Verbatim braille reproduction

**Semantic validation**:

1. **Contraction consistency**: Same input → same contraction
2. **Compression ratio**: Measure tokens saved vs English
3. **Generalization**: Test on domains not in training data
4. **Semantic separation**: Within-group > between-group similarity

### Phase 5: Integration

**Connect to Helen Keller Chip**:

```
[Pressure/Vibration Sensors]
         ↓
[Helen Keller Chip - 8-bit braille logic - 1.77µs reflexes]
         ↓
[Raspberry Pi - braille-native LLM - semantic reasoning]
         ↓
[Action: grip adjustment, alert, communication]
```

**Connect to Infinity Token swarm**:

```
[Agent A: braille-native-1b] ←→ [Agent B: braille-native-1b]
              ↓                           ↓
        [Shared contraction lattice evolves over time]
              ↓                           ↓
        [Communication bandwidth → 0 as context deepens]
```

---

## Success Criteria

### Minimum Viable Product

- [ ] 100k distillation examples generated
- [ ] 1B model fine-tuned with LoRA
- [ ] Passes all 6 braille probes at ≥95%
- [ ] Runs on Raspberry Pi 5 at ≥5 tokens/sec
- [ ] Round-trip accuracy ≥98% on Grade-1

### Stretch Goals

- [ ] Contraction discovery: Model proposes valid new contractions
- [ ] Semantic compression: 30%+ token reduction on domain text
- [ ] Swarm communication: Two models negotiate shared contractions
- [ ] Hardware integration: Connected to Helen Keller Chip

---

## Resources

### Braille References

- **Grade 1 table**: `/home/owner/CascadeProjects/entangled-swarm/braille_core/g1_map.py`
- **Grade 2 contractions**: Standard UEB (Unified English Braille) tables
- **Unicode range**: U+2800–U+28FF (256 braille patterns)

### Training Infrastructure

- **Unsloth**: Fast LoRA training (used in braille-compression)
- **Lambda Labs / Vast.ai**: Cloud GPU rental
- **llama.cpp**: Inference engine for GGUF models

### Prior Art

- **Infinity Token white paper**: `/home/owner/CascadeProjects/infinity-token/The Infinity Token: A Framework.md`
- **SCL compression**: `/home/owner/CascadeProjects/scl/Language Approximates Divine_ SCL Proof_.pdf`
- **Braille-native results**: `/home/owner/CascadeProjects/braille-compression/BRAILLE_NATIVE_README.md`

---

## Philosophy

> *"Compute is a substitute for discipline. If you design constraints that make memorization impossible, abstraction becomes cheap."*

This project implements **Path B to abstraction**: instead of overwhelming shortcuts with scale, we remove shortcuts entirely. Braille's constrained vocabulary (256 symbols) destroys pretrained priors and forces the model to learn genuine semantic compression.

The end goal is not a better translator—it's a new kind of cognition that operates in a fundamentally different representational space, enabling communication patterns impossible with natural language.

---

## Expert Feedback (Gemini, Jan 2026)

The following feedback was provided by Gemini and should be incorporated:

### 1. The "Cognitive Substrate" Thesis Validation

> "You are essentially moving from symbolic mapping (Braille as a code for English) to representational learning (Braille as a latent space for thought)."

**Key insight**: Unlike English tokens (which carry massive baggage and high-dimensional embeddings), Braille cells are discrete and low-dimensional. This makes the model's "internal monologue" much lighter for edge hardware to process.

### 2. Critical: Hybrid Data Synthesis (Phase 1 Fix)

⚠️ **The Hallucination Risk**: Standard LLMs (Claude/GPT) are notoriously bad at counting dots or visualizing Braille patterns because of their own tokenizers.

**Recommendation**: Use a **Hybrid Synthesis** approach:
- **Claude generates the logic** (e.g., "Compress 'emergency' into a Grade-3 style contraction")
- **Deterministic Python script maps rules to Unicode Braille**
- This ensures 100% accuracy required for Stage 1 training

```python
# CORRECT approach: Hybrid synthesis
def generate_training_example(concept: str) -> dict:
    # Step 1: Ask Claude for the LOGIC only
    logic_prompt = f"""
    Propose a Grade-3 braille contraction for '{concept}'.
    Output JSON: {{"letters": ["e", "m"], "reasoning": "first letters of emergency"}}
    Do NOT output braille characters.
    """
    logic = call_claude(logic_prompt)
    
    # Step 2: Deterministic mapping to braille
    braille_output = "".join(G1_MAP[letter] for letter in logic["letters"])
    
    return {
        "input": concept,
        "output": braille_output,
        "reasoning": logic["reasoning"]
    }
```

### 3. Model Selection Update

**Winner for Pi 5**: Qwen 2.5 0.5B
- Dense architecture handles structured symbolic tasks well
- Can run at Q8_0 or even F16 on Pi 5 (crucial when learning a new "alphabet")
- Smaller = faster iteration during development

### 4. Critical: Custom Tokenizer

⚠️ **The Tokenizer Problem**: Base model tokenizers represent one Braille cell as multiple UTF-8 tokens, wasting context window.

**Recommendation**: Build a custom tokenizer where each of the 256 Braille cells is its own unique token.

```python
# Custom tokenizer approach
BRAILLE_VOCAB = {chr(0x2800 + i): i for i in range(256)}  # ⠀ to ⣿

class BrailleTokenizer:
    def encode(self, text: str) -> list[int]:
        return [BRAILLE_VOCAB.get(c, self.unk_id) for c in text]
    
    def decode(self, ids: list[int]) -> str:
        return "".join(chr(0x2800 + i) for i in ids)
```

Benefits:
- Drastically reduces context window usage
- Improves "Braille-native" reasoning
- Each cell = 1 token (not 3-4 UTF-8 tokens)

### 5. Hardware Integration Insight

> "By offloading the 'haptic reflex' (1.77µs) to dedicated hardware while the LLM handles the 'semantic reasoning' (milliseconds), you are mimicking the human nervous system (spinal cord vs. cerebral cortex)."

This validates the Helen Keller Chip architecture.

### 6. New Task Category: Multi-Modal Anchors

Add to Phase 1 dataset generation:

**6. Haptic anchors** (5%)
```
Prompt: "Associate ⠃⠏ (blood pressure) with a tactile pattern"
Output: {
  "braille": "⠃⠏",
  "meaning": "blood pressure high",
  "haptic_pattern": [1, 0, 1, 0, 1, 1, 1, 1],  // vibration sequence
  "urgency": 0.9
}
```

This connects Braille sequences to physical sensations—critical for wearables/prosthetics.

### 7. Mathematical Success Criterion

**Transmission Efficiency (η)**:

$$\eta = \frac{H(M)}{L \cdot \log_2(V)}$$

Where:
- $H(M)$ = entropy of the message
- $L$ = number of Braille cells used
- $V$ = vocabulary size (64 or 256)

**Goal for Grade ∞**: Minimize $L$ while maintaining $H(M)$.

Add to validation metrics:
```python
def transmission_efficiency(message: str, braille: str, vocab_size: int = 256) -> float:
    """Calculate η for a compression."""
    import math
    H_M = len(message) * 4.5  # ~4.5 bits/char for English
    L = len(braille)
    return H_M / (L * math.log2(vocab_size))
```

Target: η > 1.5 for domain-specific compressions (Grade 3+)

---

## Updated Phase 1: Hybrid Data Generation

Based on Gemini's feedback, here's the corrected generation approach:

```python
import anthropic
import json
from pathlib import Path

# Deterministic Grade-1 mapping (source of truth)
G1_MAP = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
    'z': '⠵', ' ': '⠀',
    # ... full table in entangled-swarm/braille_core/g1_map.py
}

G2_CONTRACTIONS = {
    'the': '⠮', 'and': '⠯', 'for': '⠿', 'of': '⠷', 'with': '⠾',
    'ch': '⠡', 'gh': '⠣', 'sh': '⠩', 'th': '⠹', 'wh': '⠱',
    'ed': '⠫', 'er': '⠻', 'ou': '⠳', 'ow': '⠪', 'st': '⠌',
    # ... standard UEB contractions
}

client = anthropic.Anthropic()

def deterministic_g1_encode(text: str) -> str:
    """100% accurate Grade-1 encoding."""
    return ''.join(G1_MAP.get(c.lower(), '⠀') for c in text)

def deterministic_g2_encode(text: str) -> str:
    """Grade-2 encoding with standard contractions."""
    result = text.lower()
    for word, contraction in sorted(G2_CONTRACTIONS.items(), key=lambda x: -len(x[0])):
        result = result.replace(word, contraction)
    return ''.join(G1_MAP.get(c, c) for c in result)

def generate_contraction_logic(concept: str) -> dict:
    """Ask Claude for contraction LOGIC only, not braille output."""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Propose a Grade-3 braille contraction for: "{concept}"
            
Output JSON only:
{{
  "letters": ["x", "y"],  // which letters to use
  "reasoning": "why these letters represent the concept"
}}

Do NOT output braille characters. Only output the JSON."""
        }]
    )
    return json.loads(response.content[0].text)

def generate_hybrid_example(concept: str, task_type: str) -> dict:
    """Generate training example using hybrid approach."""
    
    if task_type == "g1_encode":
        # 100% deterministic
        return {
            "instruction": "Encode to Grade-1 braille",
            "input": concept,
            "output": deterministic_g1_encode(concept),
            "task_type": task_type
        }
    
    elif task_type == "g2_encode":
        # 100% deterministic
        return {
            "instruction": "Encode to Grade-2 braille",
            "input": concept,
            "output": deterministic_g2_encode(concept),
            "task_type": task_type
        }
    
    elif task_type == "contraction_discovery":
        # Hybrid: Claude for logic, Python for braille
        logic = generate_contraction_logic(concept)
        braille = ''.join(G1_MAP.get(l, '⠀') for l in logic["letters"])
        return {
            "instruction": f"Propose a contraction for '{concept}'",
            "input": concept,
            "output": f"{braille} - {logic['reasoning']}",
            "task_type": task_type,
            "metadata": logic
        }
    
    # ... other task types
```

---

## Contact

This project is part of a larger research program on embodied AI and semantic compression. The theoretical framework (Infinity Token) and hardware layer (Helen Keller Chip) are documented in adjacent repositories.

**Builder**: When you complete a phase, update the relevant README and commit to the `feature/braille-distillation` branch.
