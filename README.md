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
- Custom browser fingerprinting solution for user identification without external APIs
- MongoDB integration for progress tracking and user data
- Haptic feedback using Web Vibration API for mobile devices
- Mobile optimization with touch gesture support
- Secure encryption of user data with hashed identifiers

## Tech Stack

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Processing**: TensorFlow.js
- **Security**: Custom browser fingerprinting, SHA-256 hashing, bcrypt
- **Haptic Feedback**: Web Vibration API
- **Internationalization**: Custom multilingual braille encoding

## Data Privacy & Storage

BrailleBuddy takes data privacy seriously:

- No personally identifiable information is stored
- Custom fingerprinting solution that doesn't rely on external services
- User fingerprints are hashed using SHA-256 before being saved to MongoDB
- All learning data is processed locally using TensorFlow.js
- Session data is encrypted with a secure session key
- No third-party APIs are used for user identification
- Users can opt out of fingerprinting at any time

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
MONGODB_URI=your_mongodb_connection_string
AI_COMPRESSION_ENABLED=true
SESSION_SECRET=your_random_secret_key
TENSORFLOW_MODEL_PATH=path/to/your/model
```

For detailed deployment instructions, see the `DEPLOYMENT.md` file.

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
- **Dynamic Difficulty Adjustment**: The app analyzes user performance and adjusts difficulty levels in real-time, ensuring an adaptive, personalized experience
- **Keyword Extraction**: Identifies important concepts to reinforce during learning sessions
- **Pattern Recognition**: Identifies patterns in user interactions to provide personalized feedback
- **Learning Path Optimization**: Uses historical performance data to optimize lesson structure for each user
- **Text Compression**: Implements AI-driven text compression for optimized braille learning
- **Performance Analytics**: Provides insights into learning patterns without sending data to external servers
- **Adaptive Testing**: Generates personalized tests based on user's weak areas

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