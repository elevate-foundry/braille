document.addEventListener('DOMContentLoaded', function() {
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
        const letters = Object.keys(brailleAlphabet);
        currentPracticeLetter = letters[Math.floor(Math.random() * letters.length)];
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
        } else {
            practiceFeedback.textContent = `Incorrect. This is the letter ${currentPracticeLetter.toUpperCase()}.`;
            practiceFeedback.className = 'feedback incorrect';
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
        gameArea.innerHTML = `
            <h3>Braille Memory Match</h3>
            <p>Match the letters with their braille patterns. Click on cards to flip them and find matching pairs.</p>
            <div class="memory-game">
                <p>Coming soon!</p>
            </div>
        `;
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
});
