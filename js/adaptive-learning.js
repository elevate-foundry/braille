/**
 * BrailleBuddy Adaptive Learning System
 * 
 * This module provides AI-driven adaptivity to personalize the learning experience
 * based on user performance and learning patterns.
 */

class AdaptiveLearningSystem {
    constructor() {
        this.initialized = false;
        this.learningPaths = {
            'standard': {
                name: 'Standard Path',
                description: 'Learn the alphabet in standard order',
                sequence: 'abcdefghijklmnopqrstuvwxyz'.split('')
            },
            'frequency': {
                name: 'Frequency Path',
                description: 'Learn letters based on their frequency in English',
                sequence: 'etaoinsrhdlucmfywgpbvkjxqz'.split('')
            },
            'similarity': {
                name: 'Similarity Path',
                description: 'Group letters with similar braille patterns',
                sequence: 'aceimouy,bfgjkpqrsvz,dhntwxl'.split(',').flatMap(group => group.split(''))
            },
            'adaptive': {
                name: 'Adaptive Path',
                description: 'Dynamically adjusted based on your performance',
                sequence: [] // Will be generated dynamically
            }
        };
    }

    // Initialize the adaptive learning system
    initialize() {
        if (!window.progressTracker) {
            console.error('Progress tracker not found. Adaptive learning requires progress tracking.');
            return;
        }

        this.initialized = true;
        
        // Add UI elements for adaptive learning
        this.addAdaptiveUI();
        
        // Generate initial adaptive path if needed
        if (this.getCurrentLearningPath() === 'adaptive') {
            this.generateAdaptivePath();
        }
    }

    // Get the current learning path from user settings
    getCurrentLearningPath() {
        if (!window.progressTracker) return 'standard';
        
        return window.progressTracker.userData.adaptiveData.learningPath;
    }

    // Set the learning path
    setLearningPath(pathName) {
        if (!window.progressTracker) return;
        
        if (this.learningPaths[pathName]) {
            window.progressTracker.userData.adaptiveData.learningPath = pathName;
            window.progressTracker.saveUserData();
            
            // If switching to adaptive path, generate it
            if (pathName === 'adaptive') {
                this.generateAdaptivePath();
            }
        }
    }

    // Generate an adaptive learning path based on user performance
    generateAdaptivePath() {
        if (!window.progressTracker) return;
        
        const userData = window.progressTracker.userData;
        const difficultLetters = userData.adaptiveData.difficultLetters;
        const masteredLetters = userData.progress.masteredLetters;
        const learnedLetters = userData.progress.learnedLetters;
        
        // Start with all letters
        const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        
        // Categorize letters
        const difficult = [];
        const easy = [];
        const unknown = [];
        
        allLetters.forEach(letter => {
            if (masteredLetters.includes(letter)) {
                // Already mastered, low priority
                easy.push(letter);
            } else if (difficultLetters[letter] && difficultLetters[letter].attempts > 0) {
                // Has attempts but not mastered, high priority
                const successRate = difficultLetters[letter].correct / difficultLetters[letter].attempts;
                difficult.push({
                    letter,
                    successRate,
                    attempts: difficultLetters[letter].attempts
                });
            } else if (learnedLetters.includes(letter)) {
                // Learned but not practiced, medium priority
                unknown.push(letter);
            } else {
                // Not learned yet, medium-high priority
                unknown.push(letter);
            }
        });
        
        // Sort difficult letters by success rate (lowest first)
        difficult.sort((a, b) => a.successRate - b.successRate);
        
        // Create adaptive sequence: difficult letters first, then unknown, then easy
        const adaptiveSequence = [
            ...difficult.map(item => item.letter),
            ...this.shuffleArray(unknown),
            ...this.shuffleArray(easy)
        ];
        
        // Update the adaptive path
        this.learningPaths.adaptive.sequence = adaptiveSequence;
        
        return adaptiveSequence;
    }

    // Get the next recommended letter to learn or practice
    getNextRecommendedLetter() {
        if (!window.progressTracker) return 'a';
        
        const currentPath = this.getCurrentLearningPath();
        const pathSequence = this.learningPaths[currentPath].sequence;
        
        // For adaptive path, always regenerate to get the most up-to-date recommendations
        if (currentPath === 'adaptive') {
            return this.generateAdaptivePath()[0];
        }
        
        // For other paths, find the first letter in the sequence that's not mastered
        const masteredLetters = window.progressTracker.userData.progress.masteredLetters;
        for (const letter of pathSequence) {
            if (!masteredLetters.includes(letter)) {
                return letter;
            }
        }
        
        // If all letters are mastered, return the first letter
        return pathSequence[0];
    }

    // Get a set of letters to focus on for practice
    getRecommendedPracticeSet(count = 5) {
        if (!window.progressTracker) {
            return 'abcde'.split('');
        }
        
        // First try to use the recommended letters from progress tracker
        const recommended = window.progressTracker.userData.adaptiveData.recommendedLetters;
        if (recommended && recommended.length > 0) {
            return recommended.slice(0, count);
        }
        
        // Otherwise, generate based on the current learning path
        const currentPath = this.getCurrentLearningPath();
        const pathSequence = this.learningPaths[currentPath].sequence;
        
        // For adaptive path, regenerate
        if (currentPath === 'adaptive') {
            return this.generateAdaptivePath().slice(0, count);
        }
        
        // For other paths, get the next set of letters that aren't mastered
        const masteredLetters = window.progressTracker.userData.progress.masteredLetters;
        const notMastered = pathSequence.filter(letter => !masteredLetters.includes(letter));
        
        return notMastered.slice(0, count);
    }

    // Add UI elements for adaptive learning
    addAdaptiveUI() {
        // Create learning path selector
        const learningPathSelector = document.createElement('div');
        learningPathSelector.className = 'learning-path-selector';
        learningPathSelector.innerHTML = `
            <h3>Learning Path</h3>
            <p>Choose how you want to learn braille:</p>
            <select id="learning-path-select">
                ${Object.keys(this.learningPaths).map(path => `
                    <option value="${path}" ${this.getCurrentLearningPath() === path ? 'selected' : ''}>
                        ${this.learningPaths[path].name}
                    </option>
                `).join('')}
            </select>
            <p id="path-description">${this.learningPaths[this.getCurrentLearningPath()].description}</p>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .learning-path-selector {
                background-color: #f0f0f0;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            
            .learning-path-selector h3 {
                color: var(--primary-color);
                margin-bottom: 10px;
            }
            
            #learning-path-select {
                padding: 8px;
                border-radius: 5px;
                border: 2px solid var(--primary-color);
                margin: 10px 0;
                font-family: inherit;
                font-size: 1rem;
            }
            
            #path-description {
                font-style: italic;
                margin-top: 10px;
            }
            
            .progress-dashboard {
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            
            .progress-dashboard h3 {
                color: var(--primary-color);
                margin-bottom: 15px;
                text-align: center;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                background-color: #f0f0f0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 1.8rem;
                font-weight: bold;
                color: var(--primary-color);
                margin: 5px 0;
            }
            
            .stat-label {
                font-size: 0.9rem;
                color: #666;
            }
            
            .progress-bar-container {
                height: 20px;
                background-color: #e0e0e0;
                border-radius: 10px;
                margin: 15px 0;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background-color: var(--accent-color);
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            
            .achievement-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            
            .achievement {
                background-color: #f0f0f0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                border: 2px solid transparent;
                opacity: 0.7;
            }
            
            .achievement.earned {
                border-color: var(--secondary-color);
                opacity: 1;
            }
            
            .achievement h4 {
                color: var(--primary-color);
                margin-bottom: 5px;
            }
            
            .achievement p {
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .achievement .date {
                font-size: 0.8rem;
                color: #666;
            }
            
            .recommended-letters {
                margin-top: 20px;
                text-align: center;
            }
            
            .recommended-letters h4 {
                color: var(--primary-color);
                margin-bottom: 10px;
            }
            
            .letter-pills {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
            }
            
            .letter-pill {
                background-color: var(--accent-color);
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .letter-pill:hover {
                transform: scale(1.1);
            }
        `;
        
        // Add to document
        document.head.appendChild(style);
        
        // Find the learn section to add the learning path selector
        const learnSection = document.getElementById('learn');
        if (learnSection) {
            // Add before the braille grid
            const brailleGrid = learnSection.querySelector('.braille-grid');
            if (brailleGrid) {
                learnSection.insertBefore(learningPathSelector, brailleGrid);
            } else {
                learnSection.appendChild(learningPathSelector);
            }
            
            // Add event listener to the select
            const select = document.getElementById('learning-path-select');
            const pathDescription = document.getElementById('path-description');
            
            if (select && pathDescription) {
                select.addEventListener('change', () => {
                    const selectedPath = select.value;
                    this.setLearningPath(selectedPath);
                    pathDescription.textContent = this.learningPaths[selectedPath].description;
                });
            }
        }
        
        // Create progress dashboard
        this.createProgressDashboard();
    }

    // Create a progress dashboard to display user statistics and achievements
    createProgressDashboard() {
        if (!window.progressTracker) return;
        
        // Create dashboard element
        const dashboard = document.createElement('div');
        dashboard.className = 'progress-dashboard';
        dashboard.id = 'progress-dashboard';
        
        // Update the dashboard with current stats
        this.updateProgressDashboard();
        
        // Create a new section for the dashboard
        const mainElement = document.querySelector('main');
        if (mainElement) {
            // Create progress section
            const progressSection = document.createElement('section');
            progressSection.id = 'progress';
            progressSection.className = 'hidden-section';
            progressSection.innerHTML = `
                <h2>Your Progress</h2>
            `;
            
            // Add dashboard to the section
            progressSection.appendChild(dashboard);
            
            // Add section to main
            mainElement.appendChild(progressSection);
            
            // Add navigation link
            const navList = document.querySelector('nav ul');
            if (navList) {
                const progressNavItem = document.createElement('li');
                progressNavItem.innerHTML = `<a href="#" data-section="progress">Progress</a>`;
                navList.appendChild(progressNavItem);
                
                // Add event listener to the new nav item
                const navLink = progressNavItem.querySelector('a');
                navLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Update active link
                    document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                    
                    // Show progress section
                    document.querySelectorAll('main section').forEach(section => {
                        if (section.id === 'progress') {
                            section.classList.remove('hidden-section');
                            section.classList.add('active-section');
                            
                            // Update dashboard when shown
                            this.updateProgressDashboard();
                        } else {
                            section.classList.add('hidden-section');
                            section.classList.remove('active-section');
                        }
                    });
                });
            }
        }
    }

    // Update the progress dashboard with current statistics
    updateProgressDashboard() {
        if (!window.progressTracker) return;
        
        const dashboard = document.getElementById('progress-dashboard');
        if (!dashboard) return;
        
        // Get current stats
        const stats = window.progressTracker.getProgressStats();
        
        // Update dashboard content
        dashboard.innerHTML = `
            <h3>Learning Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalLettersLearned}/26</div>
                    <div class="stat-label">Letters Learned</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalLettersMastered}/26</div>
                    <div class="stat-label">Letters Mastered</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalPracticeAttempts}</div>
                    <div class="stat-label">Practice Attempts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.accuracy}%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.streakDays}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.achievements}</div>
                    <div class="stat-label">Achievements</div>
                </div>
            </div>
            
            <h3>Overall Progress</h3>
            <div>
                <p>Letters Learned:</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(stats.totalLettersLearned / 26 * 100)}%"></div>
                </div>
                <p>Letters Mastered:</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(stats.totalLettersMastered / 26 * 100)}%"></div>
                </div>
            </div>
            
            <div class="recommended-letters">
                <h4>Recommended Letters to Practice</h4>
                <p>Focus on these letters to improve your skills:</p>
                <div class="letter-pills">
                    ${stats.recommendedLetters.map(letter => `
                        <div class="letter-pill" data-letter="${letter}">${letter.toUpperCase()}</div>
                    `).join('')}
                </div>
            </div>
            
            <h3>Achievements</h3>
            <div class="achievement-list">
                ${this.generateAchievementsList()}
            </div>
        `;
        
        // Add event listeners to letter pills
        dashboard.querySelectorAll('.letter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const letter = pill.getAttribute('data-letter');
                
                // Switch to learn section and show this letter
                document.querySelector('nav a[data-section="learn"]').click();
                
                // Find and click the letter in the grid
                const letterElement = document.querySelector(`.braille-letter[data-letter="${letter}"]`);
                if (letterElement) {
                    letterElement.click();
                }
            });
        });
    }

    // Generate HTML for the achievements list
    generateAchievementsList() {
        if (!window.progressTracker) return '';
        
        const userData = window.progressTracker.userData;
        const earnedAchievements = userData.achievements;
        
        // Define all possible achievements
        const allAchievements = [
            { id: 'first_letter', name: 'First Steps', description: 'Learned your first braille letter' },
            { id: 'ten_letters', name: 'Getting There', description: 'Learned 10 braille letters' },
            { id: 'all_letters', name: 'Alphabet Master', description: 'Learned all 26 braille letters' },
            { id: 'first_correct', name: 'First Success', description: 'Got your first braille letter correct' },
            { id: 'fifty_attempts', name: 'Practice Makes Perfect', description: 'Completed 50 practice attempts' },
            { id: 'three_day_streak', name: 'Consistent Learner', description: 'Practiced for 3 days in a row' },
            { id: 'seven_day_streak', name: 'Week Warrior', description: 'Practiced for 7 days in a row' },
            { id: 'five_mastered', name: 'Braille Beginner', description: 'Mastered 5 braille letters' },
            { id: 'all_mastered', name: 'Braille Expert', description: 'Mastered all 26 braille letters' }
        ];
        
        // Generate HTML for each achievement
        return allAchievements.map(achievement => {
            const earned = earnedAchievements.find(a => a.id === achievement.id);
            
            return `
                <div class="achievement ${earned ? 'earned' : ''}">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    ${earned ? `<div class="date">Earned: ${new Date(earned.date).toLocaleDateString()}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Helper function to shuffle an array
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// Create global instance
const adaptiveLearning = new AdaptiveLearningSystem();
