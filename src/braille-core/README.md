# BrailleCore

BrailleCore is a lightweight, efficient system for braille encoding, compression, and haptic feedback optimization. It represents a shift from the transformer-based BrailleGPT approach to a more specialized architecture that better aligns with braille's inherent properties as a data compression system.

## Architecture

BrailleCore consists of three main components:

1. **BrailleFST (Finite State Transducer)** - A deterministic rule-based system for efficient braille encoding/decoding
2. **BrailleAE (Autoencoder)** - A neural compression system that learns optimal braille contractions (coming soon)
3. **HapticBBES** - Specialized compression optimized for haptic feedback patterns (coming soon)

## Why BrailleCore?

While transformer-based models like GPT are powerful for text generation, they're not optimized for the specific requirements of braille encoding and compression:

- **Efficiency**: BrailleCore is designed to run on low-powered devices, including mobile and embedded systems
- **Determinism**: The FST approach ensures consistent, rule-based encoding/decoding
- **Specialization**: Purpose-built for braille's unique properties as a compression system
- **Privacy**: Minimizes data exposure by processing locally without requiring cloud services
- **Haptic Optimization**: Specifically designed to work with vibration patterns and haptic feedback

## Components

### BrailleFST

The Finite State Transducer (FST) is a lightweight, deterministic system for converting between text and braille. It supports:

- Grade 1 (uncontracted) and Grade 2 (contracted) braille
- Multiple braille standards
- Efficient binary encoding (BBES format)
- Fast encoding/decoding with minimal resources

### BrailleAE (Coming Soon)

The Autoencoder component will learn optimal braille contractions based on language usage patterns:

- Neural compression of text into efficient braille patterns
- Learning new contractions beyond standard Grade 2
- Adaptation to different languages and contexts
- Optimizing for minimal dot patterns while maintaining readability

### HapticBBES (Coming Soon)

The Haptic-optimized BBES system will focus on vibration patterns for tactile feedback:

- Optimizing patterns for human distinguishability
- Creating a hierarchy based on frequency in language
- Adapting to individual user sensitivity
- Supporting the existing haptic feedback modes

## Integration with BBID

BrailleCore works seamlessly with the BrailleBuddy Identity (BBID) system, providing:

- Efficient encoding of user profiles and preferences
- Privacy-preserving identity verification
- Secure device fingerprinting using BBES encoding

## Usage

```javascript
// Initialize BrailleFST
const brailleFST = new BrailleFST({
    grade: 2,        // Grade 1 (uncontracted) or Grade 2 (contracted)
    standard: 'ueb', // Universal English Braille
    language: 'en'   // English
});

// Encode text to braille
const result = brailleFST.encode("Hello, world!");
console.log(result.unicode); // Unicode braille characters
console.log(result.binary);  // Binary representation
console.log(result.bbes);    // BBES format (base64 encoded)

// Decode braille to text
const text = brailleFST.decode(result.unicode, 'unicode');
console.log(text); // "hello, world!"
```

## Performance

BrailleCore significantly outperforms traditional approaches in terms of:

- Encoding/decoding speed
- Memory usage
- Compression ratio
- Battery efficiency on mobile devices

## Roadmap

1. ✅ BrailleFST implementation
2. 🔄 Comprehensive test suite and benchmarking
3. 🔄 BrailleAE development
4. 🔄 HapticBBES integration
5. 🔄 Multilingual support expansion

## Demo

See the `braille-core-demo.html` file for an interactive demonstration of BrailleCore's capabilities.
