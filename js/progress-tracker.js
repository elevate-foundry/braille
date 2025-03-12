/**
 * BrailleBuddy Progress Tracker
 * 
 * This module handles user progress tracking, achievements, and adaptive learning features.
 * It stores user data in localStorage to persist between sessions.
 */

class ProgressTracker {
    constructor() {
        this.userData = this.loadUserData();
        this.initializeIfNeeded();
    }

    // Load user data from localStorage or create new data if none exists
    loadUserData() {
        const savedData = localStorage.getItem('brailleBuddyUserData');
        return savedData ? JSON.parse(savedData) : null;
    }

    // Initialize user data structure if this is a first-time user
    initializeIfNeeded() {
        if (!this.userData) {
            this.userData = {
                username: '',
                displayName: '',
                created: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                settings: {
                    useKeyboardInput: false,
                    soundEffects: true,
                    highContrast: false,
                    adaptiveLearning: true
                },
                progress: {
                    learnedLetters: [],
                    masteredLetters: [],
                    totalPracticeAttempts: 0,
                    correctAnswers: 0,
                    streakDays: 0,
                    lastPracticeDate: null
                },
                achievements: [],
                sessionData: {
                    currentSession: {
                        startTime: new Date().toISOString(),
                        practiceAttempts: 0,
                        correctAnswers: 0,
                        lettersViewed: []
                    },
                    previousSessions: []
                },
                adaptiveData: {
                    difficultLetters: {},
                    recommendedLetters: [],
                    learningPath: 'standard'
                }
            };
            this.saveUserData();
        } else {
            // Update last login time
            this.userData.lastLogin = new Date().toISOString();
            this.saveUserData();
        }
    }

    // Save user data to localStorage
    saveUserData() {
        localStorage.setItem('brailleBuddyUserData', JSON.stringify(this.userData));
    }

    // Set user profile information
    setUserProfile(username, displayName) {
        this.userData.username = username;
        this.userData.displayName = displayName || username;
        this.saveUserData();
    }

    // Update user settings
    updateSettings(settings) {
        this.userData.settings = { ...this.userData.settings, ...settings };
        this.saveUserData();
    }

    // Record that a letter has been learned (viewed in learn mode)
    recordLetterLearned(letter) {
        letter = letter.toLowerCase();
        if (!this.userData.progress.learnedLetters.includes(letter)) {
            this.userData.progress.learnedLetters.push(letter);
            this.saveUserData();
            this.checkForAchievements();
        }
        
        // Also record for the current session
        if (!this.userData.sessionData.currentSession.lettersViewed.includes(letter)) {
            this.userData.sessionData.currentSession.lettersViewed.push(letter);
            this.saveUserData();
        }
    }

    // Record a practice attempt
    recordPracticeAttempt(letter, isCorrect) {
        letter = letter.toLowerCase();
        
        // Update total counts
        this.userData.progress.totalPracticeAttempts++;
        if (isCorrect) {
            this.userData.progress.correctAnswers++;
        }
        
        // Update session data
        this.userData.sessionData.currentSession.practiceAttempts++;
        if (isCorrect) {
            this.userData.sessionData.currentSession.correctAnswers++;
        }
        
        // Update adaptive data
        if (!this.userData.adaptiveData.difficultLetters[letter]) {
            this.userData.adaptiveData.difficultLetters[letter] = {
                attempts: 0,
                correct: 0
            };
        }
        
        this.userData.adaptiveData.difficultLetters[letter].attempts++;
        if (isCorrect) {
            this.userData.adaptiveData.difficultLetters[letter].correct++;
        }
        
        // Check if letter is mastered (80% correct with at least 5 attempts)
        const letterData = this.userData.adaptiveData.difficultLetters[letter];
        if (letterData.attempts >= 5 && (letterData.correct / letterData.attempts) >= 0.8) {
            if (!this.userData.progress.masteredLetters.includes(letter)) {
                this.userData.progress.masteredLetters.push(letter);
            }
        }
        
        // Update last practice date and check streak
        const today = new Date().toISOString().split('T')[0];
        const lastPractice = this.userData.progress.lastPracticeDate;
        
        if (lastPractice) {
            const lastDate = new Date(lastPractice);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];
            
            if (lastPractice === yesterdayString) {
                // Practiced yesterday, increment streak
                this.userData.progress.streakDays++;
            } else if (lastPractice !== today) {
                // Didn't practice yesterday and not already recorded today, reset streak
                this.userData.progress.streakDays = 1;
            }
        } else {
            // First time practicing
            this.userData.progress.streakDays = 1;
        }
        
        this.userData.progress.lastPracticeDate = today;
        
        // Generate recommended letters based on performance
        this.updateRecommendedLetters();
        
        this.saveUserData();
        this.checkForAchievements();
    }

    // Update the list of recommended letters to practice based on performance
    updateRecommendedLetters() {
        const difficultLetters = this.userData.adaptiveData.difficultLetters;
        const recommended = [];
        
        // Find letters with low success rate
        for (const letter in difficultLetters) {
            const data = difficultLetters[letter];
            if (data.attempts >= 3) {
                const successRate = data.correct / data.attempts;
                if (successRate < 0.7) {
                    recommended.push({
                        letter: letter,
                        successRate: successRate,
                        attempts: data.attempts
                    });
                }
            }
        }
        
        // Sort by success rate (lowest first)
        recommended.sort((a, b) => a.successRate - b.successRate);
        
        // Take the 5 most difficult letters
        this.userData.adaptiveData.recommendedLetters = recommended.slice(0, 5).map(item => item.letter);
        
        // If we don't have 5 difficult letters, add some random unmastered letters
        if (this.userData.adaptiveData.recommendedLetters.length < 5) {
            const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const unmastered = allLetters.filter(letter => 
                !this.userData.progress.masteredLetters.includes(letter) && 
                !this.userData.adaptiveData.recommendedLetters.includes(letter)
            );
            
            // Shuffle the unmastered letters
            for (let i = unmastered.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [unmastered[i], unmastered[j]] = [unmastered[j], unmastered[i]];
            }
            
            // Add enough to reach 5 recommended letters
            const needed = 5 - this.userData.adaptiveData.recommendedLetters.length;
            this.userData.adaptiveData.recommendedLetters = [
                ...this.userData.adaptiveData.recommendedLetters,
                ...unmastered.slice(0, needed)
            ];
        }
    }

    // Check for and award achievements
    checkForAchievements() {
        const achievements = [];
        const progress = this.userData.progress;
        
        // First letter learned
        if (progress.learnedLetters.length >= 1 && !this.hasAchievement('first_letter')) {
            achievements.push({
                id: 'first_letter',
                name: 'First Steps',
                description: 'Learned your first braille letter',
                date: new Date().toISOString()
            });
        }
        
        // 10 letters learned
        if (progress.learnedLetters.length >= 10 && !this.hasAchievement('ten_letters')) {
            achievements.push({
                id: 'ten_letters',
                name: 'Getting There',
                description: 'Learned 10 braille letters',
                date: new Date().toISOString()
            });
        }
        
        // All letters learned
        if (progress.learnedLetters.length >= 26 && !this.hasAchievement('all_letters')) {
            achievements.push({
                id: 'all_letters',
                name: 'Alphabet Master',
                description: 'Learned all 26 braille letters',
                date: new Date().toISOString()
            });
        }
        
        // First correct answer
        if (progress.correctAnswers >= 1 && !this.hasAchievement('first_correct')) {
            achievements.push({
                id: 'first_correct',
                name: 'First Success',
                description: 'Got your first braille letter correct',
                date: new Date().toISOString()
            });
        }
        
        // 50 practice attempts
        if (progress.totalPracticeAttempts >= 50 && !this.hasAchievement('fifty_attempts')) {
            achievements.push({
                id: 'fifty_attempts',
                name: 'Practice Makes Perfect',
                description: 'Completed 50 practice attempts',
                date: new Date().toISOString()
            });
        }
        
        // 3-day streak
        if (progress.streakDays >= 3 && !this.hasAchievement('three_day_streak')) {
            achievements.push({
                id: 'three_day_streak',
                name: 'Consistent Learner',
                description: 'Practiced for 3 days in a row',
                date: new Date().toISOString()
            });
        }
        
        // 7-day streak
        if (progress.streakDays >= 7 && !this.hasAchievement('seven_day_streak')) {
            achievements.push({
                id: 'seven_day_streak',
                name: 'Week Warrior',
                description: 'Practiced for 7 days in a row',
                date: new Date().toISOString()
            });
        }
        
        // 5 mastered letters
        if (progress.masteredLetters.length >= 5 && !this.hasAchievement('five_mastered')) {
            achievements.push({
                id: 'five_mastered',
                name: 'Braille Beginner',
                description: 'Mastered 5 braille letters',
                date: new Date().toISOString()
            });
        }
        
        // All mastered letters
        if (progress.masteredLetters.length >= 26 && !this.hasAchievement('all_mastered')) {
            achievements.push({
                id: 'all_mastered',
                name: 'Braille Expert',
                description: 'Mastered all 26 braille letters',
                date: new Date().toISOString()
            });
        }
        
        // Add any new achievements
        if (achievements.length > 0) {
            this.userData.achievements = [...this.userData.achievements, ...achievements];
            this.saveUserData();
            return achievements; // Return new achievements for notification
        }
        
        return [];
    }

    // Check if user has a specific achievement
    hasAchievement(achievementId) {
        return this.userData.achievements.some(a => a.id === achievementId);
    }

    // Get user progress statistics
    getProgressStats() {
        const stats = {
            totalLettersLearned: this.userData.progress.learnedLetters.length,
            totalLettersMastered: this.userData.progress.masteredLetters.length,
            totalPracticeAttempts: this.userData.progress.totalPracticeAttempts,
            correctAnswers: this.userData.progress.correctAnswers,
            accuracy: this.userData.progress.totalPracticeAttempts > 0 
                ? (this.userData.progress.correctAnswers / this.userData.progress.totalPracticeAttempts * 100).toFixed(1) 
                : 0,
            streakDays: this.userData.progress.streakDays,
            achievements: this.userData.achievements.length,
            recommendedLetters: this.userData.adaptiveData.recommendedLetters
        };
        
        return stats;
    }

    // End the current session and save it to history
    endSession() {
        const currentSession = this.userData.sessionData.currentSession;
        currentSession.endTime = new Date().toISOString();
        currentSession.duration = (new Date(currentSession.endTime) - new Date(currentSession.startTime)) / 1000; // in seconds
        
        // Add to previous sessions
        this.userData.sessionData.previousSessions.push(currentSession);
        
        // Limit stored sessions to last 10
        if (this.userData.sessionData.previousSessions.length > 10) {
            this.userData.sessionData.previousSessions = this.userData.sessionData.previousSessions.slice(-10);
        }
        
        // Reset current session
        this.userData.sessionData.currentSession = {
            startTime: new Date().toISOString(),
            practiceAttempts: 0,
            correctAnswers: 0,
            lettersViewed: []
        };
        
        this.saveUserData();
    }
}

// Create global instance
const progressTracker = new ProgressTracker();
