/**
 * BrailleBuddy Games
 * This file contains the implementation of educational games for the BrailleBuddy application.
 */

class BrailleGames {
    constructor(progressTracker) {
        this.progressTracker = progressTracker;
        this.brailleAlphabet = {
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
    }

    /**
     * Memory Match Game
     * A game where players match letters with their braille patterns
     */
    initMemoryMatch(container, difficulty = 'easy') {
        // Clear the container
        container.innerHTML = '';
        
        // Create game UI
        const gameUI = document.createElement('div');
        gameUI.className = 'memory-game-container';
        
        // Game header with controls
        const header = document.createElement('div');
        header.className = 'game-header';
        header.innerHTML = `
            <div class="game-info">
                <div class="game-timer">Time: <span id="game-timer-value">0</span>s</div>
                <div class="game-score">Matches: <span id="game-score-value">0</span></div>
                <div class="game-attempts">Attempts: <span id="game-attempts-value">0</span></div>
            </div>
            <div class="game-controls">
                <select id="difficulty-select">
                    <option value="easy" ${difficulty === 'easy' ? 'selected' : ''}>Easy (6 pairs)</option>
                    <option value="medium" ${difficulty === 'medium' ? 'selected' : ''}>Medium (10 pairs)</option>
                    <option value="hard" ${difficulty === 'hard' ? 'selected' : ''}>Hard (13 pairs)</option>
                </select>
                <button id="restart-game" class="game-button">Restart</button>
            </div>
        `;
        
        // Game board
        const gameBoard = document.createElement('div');
        gameBoard.className = 'memory-game-board';
        gameBoard.id = 'memory-game-board';
        
        // Add elements to container
        gameUI.appendChild(header);
        gameUI.appendChild(gameBoard);
        container.appendChild(gameUI);
        
        // Add game instructions
        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        instructions.innerHTML = `
            <h4>How to Play:</h4>
            <p>Click on cards to flip them and find matching pairs. Match the letter cards with their corresponding braille pattern.</p>
            <p>Try to complete the game with as few attempts as possible!</p>
        `;
        container.appendChild(instructions);
        
        // Initialize game
        this.setupMemoryGame(difficulty);
        
        // Event listeners
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.setupMemoryGame(e.target.value);
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            const currentDifficulty = document.getElementById('difficulty-select').value;
            this.setupMemoryGame(currentDifficulty);
        });
    }
    
    setupMemoryGame(difficulty) {
        const gameBoard = document.getElementById('memory-game-board');
        const timerValue = document.getElementById('game-timer-value');
        const scoreValue = document.getElementById('game-score-value');
        const attemptsValue = document.getElementById('game-attempts-value');
        
        // Game state
        let score = 0;
        let attempts = 0;
        let flippedCards = [];
        let matchedPairs = 0;
        let gameStarted = false;
        let gameTimer = null;
        let gameTime = 0;
        
        // Reset UI
        scoreValue.textContent = '0';
        attemptsValue.textContent = '0';
        timerValue.textContent = '0';
        gameBoard.innerHTML = '';
        
        // Determine number of pairs based on difficulty
        let numberOfPairs;
        switch(difficulty) {
            case 'easy':
                numberOfPairs = 6;
                break;
            case 'medium':
                numberOfPairs = 10;
                break;
            case 'hard':
                numberOfPairs = 13;
                break;
            default:
                numberOfPairs = 6;
        }
        
        // Get letters based on user progress if available
        let letters = this.getGameLetters(numberOfPairs);
        
        // Create card pairs (letter and braille)
        let cards = [];
        letters.forEach(letter => {
            // Letter card
            cards.push({
                type: 'letter',
                value: letter,
                matched: false
            });
            
            // Braille card
            cards.push({
                type: 'braille',
                value: letter,
                matched: false
            });
        });
        
        // Shuffle cards
        cards = this.shuffleArray(cards);
        
        // Determine grid layout based on number of cards
        const totalCards = cards.length;
        let gridClass;
        
        if (totalCards <= 12) {
            gridClass = 'grid-3x4';
        } else if (totalCards <= 20) {
            gridClass = 'grid-4x5';
        } else {
            gridClass = 'grid-5x6';
        }
        
        gameBoard.className = `memory-game-board ${gridClass}`;
        
        // Create and add cards to the board
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            
            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';
            
            const cardFront = document.createElement('div');
            cardFront.className = 'card-front';
            
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            
            if (card.type === 'letter') {
                cardBack.innerHTML = `<span class="card-letter">${card.value.toUpperCase()}</span>`;
            } else {
                cardBack.innerHTML = this.createBraillePattern(card.value);
            }
            
            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardElement.appendChild(cardInner);
            
            cardElement.addEventListener('click', () => {
                // Start timer on first card click
                if (!gameStarted) {
                    gameStarted = true;
                    gameTimer = setInterval(() => {
                        gameTime++;
                        timerValue.textContent = gameTime;
                    }, 1000);
                }
                
                // Handle card flip
                this.handleCardFlip(cardElement, card, index, flippedCards, cards, () => {
                    attempts++;
                    attemptsValue.textContent = attempts;
                }, () => {
                    score++;
                    scoreValue.textContent = score;
                    matchedPairs++;
                    
                    // Check if game is complete
                    if (matchedPairs === numberOfPairs) {
                        clearInterval(gameTimer);
                        this.handleGameCompletion(gameTime, attempts, numberOfPairs);
                    }
                });
            });
            
            gameBoard.appendChild(cardElement);
        });
    }
    
    handleCardFlip(cardElement, card, index, flippedCards, allCards, onAttempt, onMatch) {
        // Ignore if card is already flipped or matched
        if (cardElement.classList.contains('flipped') || card.matched) {
            return;
        }
        
        // Ignore if two cards are already flipped
        if (flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        cardElement.classList.add('flipped');
        flippedCards.push({ element: cardElement, card: card, index: index });
        
        // Provide haptic feedback for card flip
        if (window.hapticFeedback && 
            window.progressTracker && 
            window.progressTracker.userData.settings.hapticFeedback !== false) {
            // Short vibration for card flip
            window.hapticFeedback.vibrate([50]);
            
            // If it's a braille card, provide the pattern for that letter
            if (card.type === 'braille' && card.value) {
                setTimeout(() => {
                    window.hapticFeedback.provideFeedback(card.value);
                }, 100);
            }
        }
        
        // Check for match if two cards are flipped
        if (flippedCards.length === 2) {
            onAttempt();
            
            const card1 = flippedCards[0].card;
            const card2 = flippedCards[1].card;
            
            // Check if values match and types are different
            if (card1.value === card2.value && card1.type !== card2.type) {
                // Match found
                setTimeout(() => {
                    flippedCards[0].element.classList.add('matched');
                    flippedCards[1].element.classList.add('matched');
                    
                    // Update card state
                    allCards[flippedCards[0].index].matched = true;
                    allCards[flippedCards[1].index].matched = true;
                    
                    // Provide haptic feedback for match
                    if (window.hapticFeedback && 
                        window.progressTracker && 
                        window.progressTracker.userData.settings.hapticFeedback !== false) {
                        // Success pattern for match
                        window.hapticFeedback.vibrate([100, 50, 100]);
                    }
                    
                    flippedCards = [];
                    onMatch();
                    
                    // Record progress
                    if (this.progressTracker) {
                        this.progressTracker.recordGameProgress('memory', card1.value);
                    }
                }, 500);
            } else {
                // No match
                setTimeout(() => {
                    // Provide haptic feedback for no match
                    if (window.hapticFeedback && 
                        window.progressTracker && 
                        window.progressTracker.userData.settings.hapticFeedback !== false) {
                        // Error pattern for no match
                        window.hapticFeedback.vibrate([100, 50, 100, 50, 100]);
                    }
                    
                    flippedCards[0].element.classList.remove('flipped');
                    flippedCards[1].element.classList.remove('flipped');
                    flippedCards = [];
                }, 1000);
            }
        }
    }
    
    handleGameCompletion(time, attempts, pairs) {
        // Calculate score based on time and attempts
        const baseScore = pairs * 100;
        const timeBonus = Math.max(0, 500 - time * 2);
        const attemptsBonus = Math.max(0, 500 - (attempts - pairs) * 20);
        const totalScore = baseScore + timeBonus + attemptsBonus;
        
        // Provide haptic feedback for game completion
        if (window.hapticFeedback && 
            window.progressTracker && 
            window.progressTracker.userData.settings.hapticFeedback !== false) {
            // Victory pattern for game completion
            window.hapticFeedback.vibrate([100, 50, 100, 50, 200, 50, 100, 50, 100]);
        }
        
        // Create completion message
        const gameBoard = document.getElementById('memory-game-board');
        const completionMessage = document.createElement('div');
        completionMessage.className = 'game-completion-message';
        completionMessage.innerHTML = `
            <h3>Congratulations!</h3>
            <p>You completed the game in ${time} seconds with ${attempts} attempts.</p>
            <p>Your score: ${totalScore} points</p>
            <button id="play-again" class="game-button">Play Again</button>
        `;
        
        gameBoard.innerHTML = '';
        gameBoard.appendChild(completionMessage);
        
        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            const currentDifficulty = document.getElementById('difficulty-select').value;
            this.setupMemoryGame(currentDifficulty);
        });
        
        // Record achievement if using progress tracker
        if (this.progressTracker) {
            this.progressTracker.recordGameCompletion('memory', difficulty, totalScore);
        }
    }
    
    /**
     * Helper function to create a visual braille pattern
     */
    createBraillePattern(letter) {
        const pattern = this.brailleAlphabet[letter.toLowerCase()];
        if (!pattern) return '';
        
        return `
            <div class="braille-pattern">
                <div class="braille-dot ${pattern[0] ? 'active' : ''}"></div>
                <div class="braille-dot ${pattern[1] ? 'active' : ''}"></div>
                <div class="braille-dot ${pattern[2] ? 'active' : ''}"></div>
                <div class="braille-dot ${pattern[3] ? 'active' : ''}"></div>
                <div class="braille-dot ${pattern[4] ? 'active' : ''}"></div>
                <div class="braille-dot ${pattern[5] ? 'active' : ''}"></div>
            </div>
        `;
    }
    
    /**
     * Get letters for the game, prioritizing those the user is learning
     */
    getGameLetters(count) {
        let letters = [];
        
        // If progress tracker is available, use it to get appropriate letters
        if (this.progressTracker && this.progressTracker.userData) {
            const learned = this.progressTracker.userData.learnedLetters || [];
            const mastered = this.progressTracker.userData.masteredLetters || [];
            
            // Prioritize letters being learned but not yet mastered
            const learningLetters = learned.filter(l => !mastered.includes(l));
            
            // Add learning letters first
            letters = [...learningLetters];
            
            // Add mastered letters if needed
            if (letters.length < count) {
                letters = [...letters, ...mastered];
            }
            
            // Add random letters if still needed
            if (letters.length < count) {
                const allLetters = Object.keys(this.brailleAlphabet);
                const remainingLetters = allLetters.filter(l => !letters.includes(l));
                const shuffled = this.shuffleArray(remainingLetters);
                letters = [...letters, ...shuffled.slice(0, count - letters.length)];
            }
            
            // Trim to required count
            letters = letters.slice(0, count);
        } else {
            // If no progress tracker, use random letters
            const allLetters = Object.keys(this.brailleAlphabet);
            letters = this.shuffleArray(allLetters).slice(0, count);
        }
        
        return letters;
    }
    
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// Initialize games if window is loaded
if (typeof window !== 'undefined') {
    window.brailleGames = new BrailleGames(window.progressTracker);
}
