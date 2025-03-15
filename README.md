# BrailleBuddy: Interactive Braille Learning Application

BrailleBuddy is an educational web application designed to help sighted children learn braille in an interactive and engaging way. The app combines multilingual braille encoding with AI-driven adaptivity to create a personalized learning experience, while also incorporating browser fingerprinting for secure user identification and progress tracking.

## Features

### Core Features
- Interactive braille learning exercises with varying difficulty levels
- AI-driven adaptivity that adjusts to user performance
- Multilingual support for different braille standards beyond English
- Personalized progress tracking with achievement system
- Tactile/keyboard input option using six-key input
- Responsive UI with Tailwind CSS

### Technical Features
- TensorFlow.js for local AI processing and adaptivity
- Browser fingerprinting with Fingerprint.js Pro for user identification
- MongoDB integration for progress tracking and user data
- Haptic feedback using Web Vibration API for mobile devices
- Mobile optimization with touch gesture support
- Secure encryption of user data

## Local Development

1. Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd braille-fingerprint-app
npm install
```

2. Set up environment variables:
Create a `.env` file with the following variables:
```
FINGERPRINT_SECRET_KEY=your_fingerprint_key
MONGODB_URI=your_mongodb_connection_string
```

3. Run the development server:
```bash
npm run dev
```

4. For terminal-based demo:
```bash
# Without email report
npm start

# With email report
npm start your.email@example.com
```

## TensorFlow.js Integration

BrailleBuddy uses TensorFlow.js for AI-driven adaptivity and local processing:

- **Local AI Processing**: All AI processing happens locally in the browser, enhancing privacy and reducing external API dependency
- **Dynamic Difficulty Adjustment**: The app analyzes user performance and adjusts difficulty levels accordingly
- **Keyword Extraction**: Identifies important concepts to reinforce during learning sessions
- **Pattern Recognition**: Identifies patterns in user interactions to provide personalized feedback

## Haptic Feedback

BrailleBuddy includes advanced haptic feedback features for mobile devices:

- **Multiple Haptic Modes**:
  - Standard: Consistent vibration pattern for all braille characters
  - Rhythmic: Unique rhythm patterns for different character types
  - Frequency-based: Varying intensities based on character complexity
- **Customizable Intensity**: Users can adjust vibration strength based on preference
- **Character-Specific Patterns**: Each braille character has a unique vibration pattern

## Mobile Optimization

The app is fully optimized for mobile use:

- **Touch Gestures**: Swipe navigation for easy interaction
- **Mobile-Friendly UI**: Larger touch targets and accessible controls
- **Fullscreen Mode**: Distraction-free learning experience
- **Responsive Design**: Adapts to different screen sizes and orientations

## Deploying to Vercel

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

5. Set environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add the same variables from your `.env` file

## Running on Termux (Mobile)

1. Install Termux from F-Droid
2. Set up Node.js environment:
```bash
pkg update && pkg upgrade
pkg install nodejs
```

3. Clone and set up the project:
```bash
git clone <your-repo-url>
cd braille-fingerprint-app
npm install
```

4. Run the terminal demo:
```bash
npm start
```

## Best Practices

Save a new version when:
1. Adding new medical patterns or braille encodings
2. Improving compression algorithms
3. Enhancing security features
4. Adding support for new languages
5. Implementing new fingerprinting features

Best practice is to commit changes when:
- Adding new functionality
- Fixing bugs
- Updating pattern databases
- Improving compression ratios
- Adding new report types