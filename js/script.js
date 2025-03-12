document.addEventListener('DOMContentLoaded', function() {
    // Initialize progress tracker and adaptive learning
    if (window.progressTracker) {
        // Update UI with user information
        updateUserProfileUI();
    }
    
    if (window.adaptiveLearning) {
        adaptiveLearning.initialize();
    }
    // Braille alphabet mapping
    const brailleAlphabet = {
        'a': [1, 0, 0, 0, 0, 0],
        'b': [1, 1, 0, 0, 0, 0],
        'c': [1, 0, 0, 1, 0, 0],
        'd': [1, 0, 0, 1, 1, 0],
        'e': [1, 0, 0, 0, 1, 0],
        'f': [1, 1, 0, 1, 0, 0],
        'g': [1, 1, 0, 1, 1, 0],
        'h': [1, 1, 0, 0, 1, 0],
        'i': [0, 1, 0, 1, 0, 0],
        'j': [0, 1, 0, 1, 1, 0],
        'k': [1, 0, 1, 0, 0, 0],
        'l': [1, 1, 1, 0, 0, 0],
        'm': [1, 0, 1, 1, 0, 0],
        'n': [1, 0, 1, 1, 1, 0],
        'o': [1, 0, 1, 0, 1, 0],
        'p': [1, 1, 1, 1, 0, 0],
        'q': [1, 1, 1, 1, 1, 0],
        'r': [1, 1, 1, 0, 1, 0],
        's': [0, 1, 1, 1, 0, 0],
        't': [0, 1, 1, 1, 1, 0],
        'u': [1, 0, 1, 0, 0, 1],
        'v': [1, 1, 1, 0, 0, 1],
        'w': [0, 1, 0, 1, 1, 1],
        'x': [1, 0, 1, 1, 0, 1],
        'y': [1, 0, 1, 1, 1, 1],
        'z': [1, 0, 1, 0, 1, 1]
    };

    // Letter descriptions for additional context
    const letterDescriptions = {
        'a': "First letter of the alphabet. Words like 'apple' and 'ant' start with A.",
        'b': "Second letter of the alphabet. Words like 'ball' and 'banana' start with B.",
        'c': "Third letter of the alphabet. Words like 'cat' and 'cookie' start with C.",
        'd': "Fourth letter of the alphabet. Words like 'dog' and 'duck' start with D.",
        'e': "Fifth letter of the alphabet. The most common letter in English.",
        'f': "Sixth letter of the alphabet. Words like 'fish' and 'frog' start with F.",
        'g': "Seventh letter of the alphabet. Words like 'goat' and 'green' start with G.",
        'h': "Eighth letter of the alphabet. Words like 'hat' and 'house' start with H.",
        'i': "Ninth letter of the alphabet. One of the five vowels.",
        'j': "Tenth letter of the alphabet. Words like 'jump' and 'juice' start with J.",
        'k': "Eleventh letter of the alphabet. Words like 'kite' and 'king' start with K.",
        'l': "Twelfth letter of the alphabet. Words like 'lion' and 'leaf' start with L.",
        'm': "Thirteenth letter of the alphabet. Words like 'mouse' and 'moon' start with M.",
        'n': "Fourteenth letter of the alphabet. Words like 'nest' and 'nose' start with N.",
        'o': "Fifteenth letter of the alphabet. One of the five vowels.",
        'p': "Sixteenth letter of the alphabet. Words like 'pig' and 'pencil' start with P.",
        'q': "Seventeenth letter of the alphabet. Almost always followed by 'u' in English.",
        'r': "Eighteenth letter of the alphabet. Words like 'rabbit' and 'red' start with R.",
        's': "Nineteenth letter of the alphabet. Words like 'sun' and 'snake' start with S.",
        't': "Twentieth letter of the alphabet. Words like 'tree' and 'tiger' start with T.",
        'u': "Twenty-first letter of the alphabet. One of the five vowels.",
        'v': "Twenty-second letter of the alphabet. Words like 'van' and 'violet' start with V.",
        'w': "Twenty-third letter of the alphabet. Words like 'water' and 'window' start with W.",
        'x': "Twenty-fourth letter of the alphabet. Words like 'x-ray' and 'xylophone' start with X.",
        'y': "Twenty-fifth letter of the alphabet. Can be both a consonant and a vowel.",
        'z': "Twenty-sixth and last letter of the alphabet. Words like 'zebra' and 'zoo' start with Z."
    };

    // DOM elements
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    const brailleGrid = document.querySelector('.braille-grid');
    const currentLetter = document.getElementById('current-letter');
    const letterDescription = document.getElementById('letter-description');
    const dots = Array.from({ length: 6 }, (_, i) => document.getElementById(`dot${i+1}`));
    
    // Practice elements
    const practiceDots = Array.from({ length: 6 }, (_, i) => document.getElementById(`practice-dot${i+1}`));
    const practiceAnswer = document.getElementById('practice-answer');
    const checkAnswerBtn = document.getElementById('check-answer');
    const nextPracticeBtn = document.getElementById('next-practice');
    const practiceFeedback = document.getElementById('practice-feedback');
    
    let currentPracticeLetter = '';

    // Navigation functionality
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.getAttribute('data-section');
            sections.forEach(section => {
                if (section.id === targetSection) {
                    section.classList.remove('hidden-section');
                    section.classList.add('active-section');
                } else {
                    section.classList.add('hidden-section');
                    section.classList.remove('active-section');
                }
            });
        });
    });

    // Populate braille grid
    function populateBrailleGrid() {
        Object.keys(brailleAlphabet).forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'braille-letter';
            letterElement.setAttribute('data-letter', letter);
            
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = letter.toUpperCase();
            
            letterElement.appendChild(letterSpan);
            brailleGrid.appendChild(letterElement);
            
            letterElement.addEventListener('click', () => {
                document.querySelectorAll('.braille-letter').forEach(el => {
                    el.classList.remove('active');
                });
                letterElement.classList.add('active');
                displayBrailleLetter(letter);
            });
        });
    }

    // Display braille representation of a letter
    function displayBrailleLetter(letter) {
        const pattern = brailleAlphabet[letter.toLowerCase()];
        
        // Update dots
        dots.forEach((dot, index) => {
            if (pattern[index] === 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update info
        currentLetter.textContent = letter.toUpperCase();
        letterDescription.textContent = letterDescriptions[letter.toLowerCase()];
        
        // Record that this letter has been learned
        if (window.progressTracker) {
            progressTracker.recordLetterLearned(letter);
            checkForNewAchievements();
        }
    }

    // Practice functionality
    function setupPractice() {
        generatePracticeLetter();
        
        checkAnswerBtn.addEventListener('click', checkAnswer);
        nextPracticeBtn.addEventListener('click', generatePracticeLetter);
        
        practiceAnswer.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
    }

    function generatePracticeLetter() {
        // Use adaptive learning if available to get recommended letters
        if (window.adaptiveLearning && window.progressTracker && 
            progressTracker.userData.settings.adaptiveLearning) {
            // Get a recommended letter to practice
            const recommendedLetters = adaptiveLearning.getRecommendedPracticeSet();
            if (recommendedLetters && recommendedLetters.length > 0) {
                // Pick a random letter from the recommended set
                currentPracticeLetter = recommendedLetters[Math.floor(Math.random() * recommendedLetters.length)];
            } else {
                // Fallback to random letter if no recommendations
                const letters = Object.keys(brailleAlphabet);
                currentPracticeLetter = letters[Math.floor(Math.random() * letters.length)];
            }
        } else {
            // Default random selection
            const letters = Object.keys(brailleAlphabet);
            currentPracticeLetter = letters[Math.floor(Math.random() * letters.length)];
        }
        
        const pattern = brailleAlphabet[currentPracticeLetter];
        
        // Update practice dots
        practiceDots.forEach((dot, index) => {
            if (pattern[index] === 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Reset UI
        practiceAnswer.value = '';
        practiceFeedback.textContent = '';
        practiceFeedback.className = 'feedback';
        practiceAnswer.focus();
    }

    function checkAnswer() {
        const userAnswer = practiceAnswer.value.toLowerCase();
        
        if (userAnswer === currentPracticeLetter) {
            practiceFeedback.textContent = 'Correct! Great job!';
            practiceFeedback.className = 'feedback correct';
            
            // Record successful practice
            if (window.progressTracker) {
                progressTracker.recordPracticeAttempt(currentPracticeLetter, true);
                checkForNewAchievements();
            }
        } else {
            practiceFeedback.textContent = `Incorrect. This is the letter ${currentPracticeLetter.toUpperCase()}.`;
            practiceFeedback.className = 'feedback incorrect';
            
            // Record failed practice
            if (window.progressTracker) {
                progressTracker.recordPracticeAttempt(currentPracticeLetter, false);
            }
        }
    }

    // Game functionality
    const playButtons = document.querySelectorAll('.play-button');
    const gameArea = document.getElementById('game-area');
    
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const game = this.getAttribute('data-game');
            gameArea.classList.remove('hidden-section');
            
            // Clear previous game
            gameArea.innerHTML = '';
            
            // Load selected game
            switch(game) {
                case 'memory':
                    loadMemoryGame();
                    break;
                case 'word-builder':
                    loadWordBuilderGame();
                    break;
                case 'speedster':
                    loadSpeedsterGame();
                    break;
            }
        });
    });

    function loadMemoryGame() {
        // Use the BrailleGames class to initialize the Memory Match game
        if (window.brailleGames) {
            brailleGames.initMemoryMatch(gameArea);
        } else {
            gameArea.innerHTML = `
                <h3>Braille Memory Match</h3>
                <p>Match the letters with their braille patterns. Click on cards to flip them and find matching pairs.</p>
                <div class="memory-game">
                    <p>Game loading error. Please refresh the page and try again.</p>
                </div>
            `;
        }
    }

    function loadWordBuilderGame() {
        gameArea.innerHTML = `
            <h3>Braille Word Builder</h3>
            <p>Build words using braille characters. Drag and drop letters to form words.</p>
            <div class="word-builder-game">
                <p>Coming soon!</p>
            </div>
        `;
    }

    function loadSpeedsterGame() {
        gameArea.innerHTML = `
            <h3>Braille Speedster</h3>
            <p>How fast can you identify braille characters? Test your speed and accuracy.</p>
            <div class="speedster-game">
                <p>Coming soon!</p>
            </div>
        `;
    }

    // Initialize the app
    populateBrailleGrid();
    setupPractice();
    
    // Display first letter by default
    displayBrailleLetter('a');
    
    // Initialize keyboard input for practice mode
    if (window.brailleKeyboard) {
        const practiceDots = Array.from({ length: 6 }, (_, i) => document.getElementById(`practice-dot${i+1}`));
        brailleKeyboard.initialize(practiceDots, function(letter, pattern) {
            if (letter === currentPracticeLetter) {
                practiceFeedback.textContent = 'Correct! Great job!';
                practiceFeedback.className = 'feedback correct';
                
                // Record successful practice
                if (window.progressTracker) {
                    progressTracker.recordPracticeAttempt(letter, true);
                    checkForNewAchievements();
                }
            } else {
                practiceFeedback.textContent = `Incorrect. This is the letter ${currentPracticeLetter.toUpperCase()}.`;
                practiceFeedback.className = 'feedback incorrect';
                
                // Record failed practice
                if (window.progressTracker) {
                    progressTracker.recordPracticeAttempt(currentPracticeLetter, false);
                }
            }
        });
    }
    
    // Set up settings and profile UI
    setupSettingsUI();
    
    // Set up achievement notifications
    setupAchievementNotifications();
});

// Update the display of user profile information
function updateUserProfileUI() {
    if (!window.progressTracker) return;
    
    const userData = progressTracker.userData;
    const profileButton = document.getElementById('profile-button');
    const profileInfo = document.getElementById('profile-info');
    const userDisplayName = document.getElementById('user-display-name');
    const streakDays = document.getElementById('streak-days');
    
    if (userData.displayName) {
        profileButton.style.display = 'none';
        profileInfo.classList.remove('hidden');
        userDisplayName.textContent = userData.displayName;
        streakDays.textContent = `${userData.progress.streakDays} days`;
    } else {
        profileButton.style.display = 'block';
        profileInfo.classList.add('hidden');
    }
}

// Set up the settings UI and modal
function setupSettingsUI() {
    const profileButton = document.getElementById('profile-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    
    // Form elements
    const usernameInput = document.getElementById('username-input');
    const displayNameInput = document.getElementById('display-name-input');
    const keyboardInputSetting = document.getElementById('keyboard-input-setting');
    const soundEffectsSetting = document.getElementById('sound-effects-setting');
    const highContrastSetting = document.getElementById('high-contrast-setting');
    const adaptiveLearningSettings = document.getElementById('adaptive-learning-setting');
    
    // Open settings modal when profile button is clicked
    profileButton.addEventListener('click', function() {
        // Populate form with current settings if available
        if (window.progressTracker) {
            const userData = progressTracker.userData;
            usernameInput.value = userData.username || '';
            displayNameInput.value = userData.displayName || '';
            keyboardInputSetting.checked = userData.settings.useKeyboardInput;
            soundEffectsSetting.checked = userData.settings.soundEffects;
            highContrastSetting.checked = userData.settings.highContrast;
            adaptiveLearningSettings.checked = userData.settings.adaptiveLearning;
        }
        
        settingsModal.classList.add('show');
    });
    
    // Close modal when X is clicked
    closeModal.addEventListener('click', function() {
        settingsModal.classList.remove('show');
    });
    
    // Close modal when clicking outside the content
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    // Save settings
    saveSettingsBtn.addEventListener('click', function() {
        if (window.progressTracker) {
            // Update user profile
            progressTracker.setUserProfile(
                usernameInput.value,
                displayNameInput.value
            );
            
            // Update settings
            progressTracker.updateSettings({
                useKeyboardInput: keyboardInputSetting.checked,
                soundEffects: soundEffectsSetting.checked,
                highContrast: highContrastSetting.checked,
                adaptiveLearning: adaptiveLearningSettings.checked
            });
            
            // Apply settings
            applySettings();
            
            // Update UI
            updateUserProfileUI();
        }
        
        settingsModal.classList.remove('show');
    });
}

// Apply current settings to the UI
function applySettings() {
    if (!window.progressTracker) return;
    
    const userData = progressTracker.userData;
    const settings = userData.settings;
    
    // Apply high contrast if enabled
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
    
    // Toggle keyboard input
    const toggleKeyboardBtn = document.querySelector('.toggle-keyboard-btn');
    if (toggleKeyboardBtn && settings.useKeyboardInput !== toggleKeyboardBtn.textContent.includes('Disable')) {
        toggleKeyboardBtn.click();
    }
}

// Check for new achievements and show notifications
function checkForNewAchievements() {
    if (!window.progressTracker) return;
    
    const newAchievements = progressTracker.checkForAchievements();
    
    if (newAchievements.length > 0) {
        // Show the most recent achievement
        const achievement = newAchievements[newAchievements.length - 1];
        showAchievementNotification(achievement.name, achievement.description);
    }
}

// Set up achievement notifications
function setupAchievementNotifications() {
    // Add high contrast styles if needed
    const style = document.createElement('style');
    style.textContent = `
        body.high-contrast {
            --primary-color: #0066cc;
            --secondary-color: #ff6600;
            --accent-color: #00aaff;
            --background-color: #ffffff;
            --text-color: #000000;
        }
        
        body.high-contrast .dot {
            border-width: 3px;
        }
        
        body.high-contrast .dot.active {
            background-color: #ff6600;
            border-color: #000000;
        }
    `;
    document.head.appendChild(style);
}

// Show achievement notification
function showAchievementNotification(name, description) {
    const notification = document.getElementById('achievement-notification');
    const achievementName = document.getElementById('achievement-name');
    const achievementDescription = document.getElementById('achievement-description');
    
    achievementName.textContent = name;
    achievementDescription.textContent = description;
    
    notification.classList.add('show');
    
    // Play sound if enabled
    if (window.progressTracker && progressTracker.userData.settings.soundEffects) {
        // Simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            
            // Stop after 0.5 seconds
            setTimeout(function() {
                oscillator.stop();
            }, 500);
        } catch (e) {
            console.log('Sound not supported');
        }
    }
    
    // Hide after 5 seconds
    setTimeout(function() {
        notification.classList.remove('show');
    }, 5000);
}
