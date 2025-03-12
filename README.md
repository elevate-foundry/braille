# BrailleBuddy - Learn Braille Through Play

BrailleBuddy is an interactive web application designed to help users learn and practice braille in a fun and engaging way. This project aims to promote braille literacy, fostering inclusivity and accessibility awareness through innovative braille encoding technologies.

## Features

- **Learn Mode**: Interactive display of the braille alphabet with descriptions and context for each letter
- **Practice Mode**: Test your knowledge by identifying braille characters
- **Games**: Fun activities to reinforce braille learning (Memory Match, Word Builder, and Speedster)
- **Haptic Feedback**: Feel braille patterns through vibration on mobile devices with multiple encoding options (Standard, Rhythmic, Frequency-based, and Biological Contractions)
- **Mobile Optimization**: Touch gestures, responsive design, and fullscreen mode for learning on-the-go
- **Multilingual Support**: Learn braille in multiple languages including English, Spanish, French, Chinese, Arabic, and Hindi
- **BBID Recognition System**: Secure identity recognition using braille-encoded fingerprints
- **BrailleFST Technology**: Efficient rule-based encoder/decoder for braille conversion

## Why Learn Braille?

Learning braille offers several benefits for sighted children:

- Promotes empathy and understanding for visually impaired people
- Enhances cognitive development and pattern recognition skills
- Improves tactile sensitivity and fine motor skills
- Builds accessibility awareness from an early age
- Creates a more inclusive society

## Getting Started

### Live Demo

Try BrailleBuddy now: [https://braillebuddy.vercel.app/](https://braillebuddy.vercel.app/)

### Local Development

1. Clone this repository
2. Run the setup script: `./setup.sh`
3. Start the local server: `python -m http.server 8000`
4. Open `http://localhost:8000` in your web browser
5. Start exploring and learning braille!

## Technical Details

BrailleBuddy is built using:
- HTML5
- CSS3
- JavaScript
- Web Vibration API for haptic feedback
- Web Bluetooth API for hardware integration
- BrailleCore technology stack
- BBID MCP (Model Context Protocol) for universal braille accessibility

### Core Technologies

#### BBID MCP Schema

The BrailleBuddy Identity (BBID) Model Context Protocol schema provides a standardized, portable identity system that works across devices while preserving privacy:

- **Universal Braille Support**: Beyond just English/UEB, supporting multiple braille codes worldwide
- **Multilingual Capabilities**: Language-specific braille representations and learning progress tracking
- **Privacy-Preserving Fingerprinting**: Secure identity recognition using braille-encoded fingerprints
- **Cross-Device Synchronization**: MCP-compatible API for seamless experience across devices
- **BrailleCore Integration**: Full support for BrailleFST, BrailleAE, and HapticBBES components
- **Haptic Optimization**: Enhanced haptic pattern support with multiple pattern types
- **Device Capabilities**: Support for various braille input/output methods (six-key, eight-key, display)

#### BrailleCore

The application is powered by our innovative BrailleCore technology stack:

1. **BrailleFST (Finite State Transducer)**: A lightweight, deterministic rule-based encoder/decoder for efficient braille conversion
2. **BrailleAE (Autoencoder)**: Neural compression system to learn optimal braille contractions
3. **HapticBBES**: Specialized compression optimized for haptic feedback and vibration patterns

#### BBID (BrailleBuddy Identity)

The BBID system provides a standardized, portable identity framework:

1. **Privacy-Preserving Fingerprinting**: Secure device identification with encryption and access control
2. **Cross-Device Synchronization**: MCP-compatible API for identity portability
3. **Braille Identity Learning**: Tools to help users recognize their identity in braille
4. **Multiple Identity Formats**: Support for native language, braille representations, and BBES compressed format

### Haptic Feedback Modes

The application offers four distinct haptic feedback modes to enhance the learning experience:

1. **Standard**: Simple dot-by-dot vibration pattern that directly corresponds to the braille cell
2. **Rhythmic**: Creates patterns with varying durations that help distinguish between different characters
3. **Frequency-based**: Varies the intensity of vibrations based on the number and position of dots in the braille cell
4. **Biological Contractions**: Mimics physiological contractions with wave-like patterns that build up, peak, and taper off, creating an intuitive tactile experience for learning braille contractions

The application is designed to be responsive and work on both desktop and mobile devices.

## Future Enhancements

- Expand universal braille support beyond current languages
- Enhance the AI-driven adaptivity system for personalized learning
- Add tactile/keyboard input options for six-key braille input
- Further develop personalized progress tracking and achievement systems
- Expand integration with physical braille learning devices via Bluetooth
- Optimize neural compression for braille contractions
- Enhance MCP integration for broader identity portability

## Contributing

This project is open source and contributions are welcome! Feel free to submit issues or pull requests to help improve BrailleBuddy.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Created with ❤️ by Ryan
