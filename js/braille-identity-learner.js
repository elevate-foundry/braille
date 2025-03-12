/**
 * BrailleIdentityLearner - Teaches users to recognize their identity in braille
 * 
 * This module implements a progressive learning system that helps users learn
 * their personal information in braille, from basic letter recognition to
 * advanced contracted braille and haptic recognition.
 */

class BrailleIdentityLearner {
    constructor(options = {}) {
        // Dependencies
        this.brailleFST = options.brailleFST || null;
        this.bbidManager = options.bbidManager || null;
        this.mcpClient = options.mcpClient || null;
        
        // User info
        this.userInfo = {
            name: options.name || '',
            address: options.address || '',
            email: options.email || '',
            phone: options.phone || '',
            customFields: options.customFields || {}
        };
        
        // Learning state
        this.learningState = {
            level: 0, // 0-5
            progress: 0, // 0-100%
            accuracy: 0, // 0-100%
            lastSession: null,
            sessionsCompleted: 0,
            challengesCompleted: 0,
            mistakePatterns: {},
            strengths: [],
            weaknesses: []
        };
        
        // Braille representations
        this.brailleRepresentations = {
            grade1: {},
            grade2: {},
            grade3: {},
            neural: {}
        };
        
        // Learning settings
        this.settings = {
            hapticFeedback: options.hapticFeedback !== false,
            audioFeedback: options.audioFeedback !== false,
            visualAids: options.visualAids !== false,
            adaptiveDifficulty: options.adaptiveDifficulty !== false,
            sessionDuration: options.sessionDuration || 300, // seconds
            repeatInterval: options.repeatInterval || 24, // hours
            challengeThreshold: options.challengeThreshold || 80 // %
        };
        
        // Storage key
        this.storageKey = 'braille_identity_learner';
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize the learner
     */
    async initialize() {
        // Load dependencies if not provided
        if (!this.brailleFST && typeof BrailleFST !== 'undefined') {
            this.brailleFST = new BrailleFST({ grade: 2, language: 'en' });
        }
        
        if (!this.bbidManager && typeof BBIDManager !== 'undefined') {
            this.bbidManager = new BBIDManager();
            await this.bbidManager.initialize();
        }
        
        // Load saved learning state
        this.loadLearningState();
        
        // Generate braille representations
        this.generateBrailleRepresentations();
        
        // Dispatch initialization event
        this._dispatchEvent('initialized', {
            level: this.learningState.level,
            progress: this.learningState.progress
        });
        
        return true;
    }
    
    /**
     * Set user information
     * @param {Object} userInfo - User information
     */
    setUserInfo(userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo };
        this.generateBrailleRepresentations();
        this.saveLearningState();
        
        this._dispatchEvent('userInfoUpdated', { userInfo: this.userInfo });
    }
    
    /**
     * Generate braille representations of user information
     */
    generateBrailleRepresentations() {
        if (!this.brailleFST) {
            console.error('BrailleFST not available');
            return;
        }
        
        try {
            // Generate Grade 1 representations
            const grade1FST = new BrailleFST({ grade: 1, language: 'en' });
            this.brailleRepresentations.grade1 = {
                name: grade1FST.encode(this.userInfo.name),
                address: grade1FST.encode(this.userInfo.address),
                email: grade1FST.encode(this.userInfo.email),
                phone: grade1FST.encode(this.userInfo.phone)
            };
            
            // Generate Grade 2 representations
            const grade2FST = new BrailleFST({ grade: 2, language: 'en' });
            this.brailleRepresentations.grade2 = {
                name: grade2FST.encode(this.userInfo.name),
                address: grade2FST.encode(this.userInfo.address),
                email: grade2FST.encode(this.userInfo.email),
                phone: grade2FST.encode(this.userInfo.phone)
            };
            
            // Generate Grade 3 representations if available
            if (typeof BrailleFSTGrade3 !== 'undefined') {
                const grade3FST = new BrailleFSTGrade3({ language: 'en' });
                this.brailleRepresentations.grade3 = {
                    name: grade3FST.encode(this.userInfo.name),
                    address: grade3FST.encode(this.userInfo.address),
                    email: grade3FST.encode(this.userInfo.email),
                    phone: grade3FST.encode(this.userInfo.phone)
                };
            }
            
            // Generate neural representations if available
            if (typeof BrailleAE !== 'undefined') {
                const brailleAE = new BrailleAE();
                this.brailleRepresentations.neural = {
                    name: brailleAE.encode(this.userInfo.name),
                    address: brailleAE.encode(this.userInfo.address),
                    email: brailleAE.encode(this.userInfo.email),
                    phone: brailleAE.encode(this.userInfo.phone)
                };
            }
            
            this._dispatchEvent('representationsGenerated', {
                representations: this.brailleRepresentations
            });
        } catch (error) {
            console.error('Error generating braille representations:', error);
        }
    }
    
    /**
     * Start a learning session
     * @param {Object} options - Session options
     * @returns {Object} - Session information
     */
    startLearningSession(options = {}) {
        const sessionType = options.type || this._getRecommendedSessionType();
        const focusField = options.focusField || 'name';
        const duration = options.duration || this.settings.sessionDuration;
        
        // Create session object
        const session = {
            id: this._generateId(),
            type: sessionType,
            focusField,
            startTime: new Date(),
            endTime: null,
            duration,
            challenges: [],
            results: {
                accuracy: 0,
                speed: 0,
                completed: false
            }
        };
        
        // Generate challenges based on session type and level
        session.challenges = this._generateChallenges(sessionType, focusField);
        
        // Update learning state
        this.learningState.lastSession = session.startTime.toISOString();
        this.saveLearningState();
        
        // Dispatch event
        this._dispatchEvent('sessionStarted', { session });
        
        return session;
    }
    
    /**
     * Complete a learning session
     * @param {Object} session - The session to complete
     * @param {Object} results - Session results
     * @returns {Object} - Updated learning state
     */
    completeSession(session, results) {
        if (!session || !results) {
            throw new Error('Session and results are required');
        }
        
        // Update session
        session.endTime = new Date();
        session.results = {
            ...session.results,
            ...results,
            completed: true
        };
        
        // Update learning state
        this.learningState.sessionsCompleted++;
        this.learningState.accuracy = this._calculateWeightedAverage(
            this.learningState.accuracy,
            results.accuracy,
            0.7 // Weight for new results
        );
        
        // Update progress based on accuracy and level
        this._updateProgress(results.accuracy);
        
        // Check if user should advance to next level
        if (this._shouldAdvanceLevel()) {
            this._advanceLevel();
        }
        
        // Save state
        this.saveLearningState();
        
        // Sync with MCP if available
        this._syncLearningState();
        
        // Dispatch event
        this._dispatchEvent('sessionCompleted', {
            session,
            learningState: this.learningState
        });
        
        return this.learningState;
    }
    
    /**
     * Submit an answer to a challenge
     * @param {Object} challenge - The challenge
     * @param {string} answer - User's answer
     * @returns {Object} - Result with correctness and feedback
     */
    submitAnswer(challenge, answer) {
        if (!challenge || !answer) {
            throw new Error('Challenge and answer are required');
        }
        
        const isCorrect = this._checkAnswer(challenge, answer);
        const feedback = this._generateFeedback(challenge, answer, isCorrect);
        
        // Track mistake patterns if incorrect
        if (!isCorrect) {
            this._trackMistakePattern(challenge, answer);
        }
        
        // Provide haptic feedback if enabled
        if (this.settings.hapticFeedback) {
            this._provideHapticFeedback(isCorrect);
        }
        
        return {
            isCorrect,
            feedback,
            challenge
        };
    }
    
    /**
     * Get braille representation of a field
     * @param {string} field - Field name (name, address, etc.)
     * @param {string} grade - Braille grade (grade1, grade2, grade3, neural)
     * @returns {Object} - Braille representation
     */
    getBrailleRepresentation(field, grade = 'grade2') {
        if (!this.brailleRepresentations[grade] || !this.brailleRepresentations[grade][field]) {
            return null;
        }
        
        return this.brailleRepresentations[grade][field];
    }
    
    /**
     * Get current learning state
     * @returns {Object} - Learning state
     */
    getLearningState() {
        return { ...this.learningState };
    }
    
    /**
     * Get learning recommendations
     * @returns {Object} - Recommendations
     */
    getLearningRecommendations() {
        // Analyze learning state to generate recommendations
        const recommendations = {
            nextSession: this._getRecommendedSessionType(),
            focusAreas: this._identifyFocusAreas(),
            estimatedTimeToNextLevel: this._estimateTimeToNextLevel(),
            practiceFrequency: this._recommendPracticeFrequency()
        };
        
        return recommendations;
    }
    
    /**
     * Export learning state
     * @returns {Object} - Exportable learning state
     */
    exportLearningState() {
        return {
            userInfo: this.userInfo,
            learningState: this.learningState,
            settings: this.settings,
            brailleRepresentations: this.brailleRepresentations
        };
    }
    
    /**
     * Import learning state
     * @param {Object} data - Imported learning state
     * @returns {boolean} - Success status
     */
    importLearningState(data) {
        if (!data || !data.learningState) {
            return false;
        }
        
        try {
            this.userInfo = data.userInfo || this.userInfo;
            this.learningState = data.learningState;
            this.settings = { ...this.settings, ...(data.settings || {}) };
            
            if (data.brailleRepresentations) {
                this.brailleRepresentations = data.brailleRepresentations;
            } else {
                this.generateBrailleRepresentations();
            }
            
            this.saveLearningState();
            
            this._dispatchEvent('stateImported', {
                learningState: this.learningState
            });
            
            return true;
        } catch (error) {
            console.error('Error importing learning state:', error);
            return false;
        }
    }
    
    /**
     * Reset learning progress
     * @param {boolean} keepUserInfo - Whether to keep user info
     * @returns {boolean} - Success status
     */
    resetProgress(keepUserInfo = true) {
        // Reset learning state
        this.learningState = {
            level: 0,
            progress: 0,
            accuracy: 0,
            lastSession: null,
            sessionsCompleted: 0,
            challengesCompleted: 0,
            mistakePatterns: {},
            strengths: [],
            weaknesses: []
        };
        
        // Optionally reset user info
        if (!keepUserInfo) {
            this.userInfo = {
                name: '',
                address: '',
                email: '',
                phone: '',
                customFields: {}
            };
            this.generateBrailleRepresentations();
        }
        
        this.saveLearningState();
        
        this._dispatchEvent('progressReset', {
            keepUserInfo
        });
        
        return true;
    }
    
    /**
     * Save learning state to storage
     */
    saveLearningState() {
        try {
            const data = {
                userInfo: this.userInfo,
                learningState: this.learningState,
                settings: this.settings
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving learning state:', error);
        }
    }
    
    /**
     * Load learning state from storage
     */
    loadLearningState() {
        try {
            const data = localStorage.getItem(this.storageKey);
            
            if (data) {
                const parsedData = JSON.parse(data);
                
                this.userInfo = parsedData.userInfo || this.userInfo;
                this.learningState = parsedData.learningState || this.learningState;
                this.settings = { ...this.settings, ...(parsedData.settings || {}) };
            }
        } catch (error) {
            console.error('Error loading learning state:', error);
        }
    }
    
    /**
     * Generate challenges for a learning session
     * @private
     * @param {string} sessionType - Type of session
     * @param {string} focusField - Field to focus on
     * @returns {Array} - Array of challenges
     */
    _generateChallenges(sessionType, focusField) {
        const challenges = [];
        const level = this.learningState.level;
        
        // Get the appropriate braille representation
        let gradeKey = 'grade1';
        if (level >= 3) gradeKey = 'grade2';
        if (level >= 4) gradeKey = 'grade3';
        
        const brailleData = this.brailleRepresentations[gradeKey][focusField];
        
        if (!brailleData) {
            console.error(`No braille data for ${focusField} in ${gradeKey}`);
            return challenges;
        }
        
        // Different challenge types based on session type
        switch (sessionType) {
            case 'letterRecognition':
                // Generate letter recognition challenges
                if (focusField === 'name') {
                    const name = this.userInfo.name;
                    for (let i = 0; i < name.length; i++) {
                        const letter = name[i];
                        if (letter.trim() === '') continue;
                        
                        challenges.push({
                            id: this._generateId(),
                            type: 'letterRecognition',
                            prompt: `What letter is this in braille?`,
                            braille: this.brailleFST.encode(letter).unicode,
                            answer: letter.toLowerCase(),
                            difficulty: 1
                        });
                    }
                }
                break;
                
            case 'wordRecognition':
                // Generate word recognition challenges
                challenges.push({
                    id: this._generateId(),
                    type: 'wordRecognition',
                    prompt: `What is your ${focusField} in braille?`,
                    braille: brailleData.unicode,
                    answer: this.userInfo[focusField].toLowerCase(),
                    difficulty: 2
                });
                break;
                
            case 'brailleToText':
                // Generate braille to text challenges
                challenges.push({
                    id: this._generateId(),
                    type: 'brailleToText',
                    prompt: `Convert this braille to text:`,
                    braille: brailleData.unicode,
                    answer: this.userInfo[focusField].toLowerCase(),
                    difficulty: 3
                });
                break;
                
            case 'textToBraille':
                // Generate text to braille challenges
                challenges.push({
                    id: this._generateId(),
                    type: 'textToBraille',
                    prompt: `Convert your ${focusField} to braille:`,
                    text: this.userInfo[focusField],
                    answer: brailleData.unicode,
                    difficulty: 4
                });
                break;
                
            case 'hapticRecognition':
                // Generate haptic recognition challenges
                challenges.push({
                    id: this._generateId(),
                    type: 'hapticRecognition',
                    prompt: `Identify your ${focusField} from haptic feedback:`,
                    hapticPattern: this._generateHapticPattern(brailleData.dots),
                    answer: this.userInfo[focusField].toLowerCase(),
                    difficulty: 5
                });
                break;
                
            default:
                // Mix of challenges based on level
                const mixedTypes = ['letterRecognition', 'wordRecognition', 'brailleToText'];
                if (level >= 3) mixedTypes.push('textToBraille');
                if (level >= 4) mixedTypes.push('hapticRecognition');
                
                for (let i = 0; i < 5; i++) {
                    const type = mixedTypes[Math.floor(Math.random() * mixedTypes.length)];
                    challenges.push(...this._generateChallenges(type, focusField));
                }
        }
        
        return challenges;
    }
    
    /**
     * Check if an answer is correct
     * @private
     * @param {Object} challenge - The challenge
     * @param {string} answer - User's answer
     * @returns {boolean} - Whether the answer is correct
     */
    _checkAnswer(challenge, answer) {
        if (!challenge || !answer) return false;
        
        // Normalize answers for comparison
        const normalizedUserAnswer = answer.toLowerCase().trim();
        const normalizedCorrectAnswer = challenge.answer.toLowerCase().trim();
        
        // For braille to text challenges, allow some flexibility
        if (challenge.type === 'brailleToText') {
            // Remove punctuation and extra spaces
            const cleanUserAnswer = normalizedUserAnswer.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
            const cleanCorrectAnswer = normalizedCorrectAnswer.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
            
            return cleanUserAnswer === cleanCorrectAnswer;
        }
        
        // For haptic recognition, be more lenient
        if (challenge.type === 'hapticRecognition') {
            // Check if answer is close enough (e.g., first name only)
            const words = normalizedCorrectAnswer.split(/\s+/);
            if (words.length > 1 && normalizedUserAnswer === words[0]) {
                return true;
            }
        }
        
        return normalizedUserAnswer === normalizedCorrectAnswer;
    }
    
    /**
     * Generate feedback for an answer
     * @private
     * @param {Object} challenge - The challenge
     * @param {string} answer - User's answer
     * @param {boolean} isCorrect - Whether the answer is correct
     * @returns {string} - Feedback message
     */
    _generateFeedback(challenge, answer, isCorrect) {
        if (isCorrect) {
            return "Correct! Great job.";
        }
        
        // Generate helpful feedback based on challenge type
        switch (challenge.type) {
            case 'letterRecognition':
                return `Not quite. The braille pattern represents '${challenge.answer}'.`;
                
            case 'wordRecognition':
            case 'brailleToText':
                return `That's not right. The braille translates to '${challenge.answer}'.`;
                
            case 'textToBraille':
                return `Not correct. Try again by focusing on each letter's braille pattern.`;
                
            case 'hapticRecognition':
                return `Incorrect. The haptic pattern represents '${challenge.answer}'.`;
                
            default:
                return `Incorrect. The correct answer is '${challenge.answer}'.`;
        }
    }
    
    /**
     * Track mistake patterns
     * @private
     * @param {Object} challenge - The challenge
     * @param {string} answer - User's answer
     */
    _trackMistakePattern(challenge, answer) {
        const patternKey = `${challenge.type}_${challenge.answer}`;
        
        if (!this.learningState.mistakePatterns[patternKey]) {
            this.learningState.mistakePatterns[patternKey] = {
                count: 0,
                answers: []
            };
        }
        
        this.learningState.mistakePatterns[patternKey].count++;
        this.learningState.mistakePatterns[patternKey].answers.push(answer);
        
        // Keep only the last 5 incorrect answers
        if (this.learningState.mistakePatterns[patternKey].answers.length > 5) {
            this.learningState.mistakePatterns[patternKey].answers.shift();
        }
    }
    
    /**
     * Update progress based on accuracy
     * @private
     * @param {number} accuracy - Session accuracy
     */
    _updateProgress(accuracy) {
        // Calculate progress increment based on accuracy and current level
        const baseIncrement = 5; // Base progress points per session
        const accuracyFactor = accuracy / 100;
        const levelFactor = 1 - (this.learningState.level * 0.1); // Higher levels progress slower
        
        const progressIncrement = baseIncrement * accuracyFactor * levelFactor;
        
        // Update progress
        this.learningState.progress += progressIncrement;
        
        // Cap at 100%
        if (this.learningState.progress > 100) {
            this.learningState.progress = 100;
        }
    }
    
    /**
     * Check if user should advance to next level
     * @private
     * @returns {boolean} - Whether to advance
     */
    _shouldAdvanceLevel() {
        // Criteria for advancing:
        // 1. Progress is at least 90%
        // 2. Accuracy is above threshold
        // 3. Completed at least 3 sessions at current level
        
        return (
            this.learningState.progress >= 90 &&
            this.learningState.accuracy >= this.settings.challengeThreshold &&
            this.learningState.sessionsCompleted >= 3
        );
    }
    
    /**
     * Advance to next level
     * @private
     */
    _advanceLevel() {
        if (this.learningState.level < 5) {
            this.learningState.level++;
            this.learningState.progress = 0;
            
            this._dispatchEvent('levelAdvanced', {
                newLevel: this.learningState.level
            });
        }
    }
    
    /**
     * Get recommended session type based on learning state
     * @private
     * @returns {string} - Recommended session type
     */
    _getRecommendedSessionType() {
        const level = this.learningState.level;
        
        // Recommend session types based on level
        switch (level) {
            case 0:
                return 'letterRecognition';
            case 1:
                return 'wordRecognition';
            case 2:
                return 'brailleToText';
            case 3:
                return 'textToBraille';
            case 4:
            case 5:
                return 'hapticRecognition';
            default:
                return 'mixed';
        }
    }
    
    /**
     * Identify focus areas based on mistake patterns
     * @private
     * @returns {Array} - Focus areas
     */
    _identifyFocusAreas() {
        const mistakePatterns = this.learningState.mistakePatterns;
        const focusAreas = [];
        
        // Find the most common mistakes
        const sortedPatterns = Object.entries(mistakePatterns)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3);
        
        for (const [pattern, data] of sortedPatterns) {
            const [type, answer] = pattern.split('_');
            
            focusAreas.push({
                type,
                content: answer,
                mistakeCount: data.count
            });
        }
        
        return focusAreas;
    }
    
    /**
     * Estimate time to next level
     * @private
     * @returns {number} - Estimated sessions needed
     */
    _estimateTimeToNextLevel() {
        const progressRemaining = 100 - this.learningState.progress;
        const averageProgressPerSession = 5 * (this.learningState.accuracy / 100);
        
        if (averageProgressPerSession <= 0) {
            return 10; // Default if no data
        }
        
        return Math.ceil(progressRemaining / averageProgressPerSession);
    }
    
    /**
     * Recommend practice frequency
     * @private
     * @returns {string} - Recommended frequency
     */
    _recommendPracticeFrequency() {
        const accuracy = this.learningState.accuracy;
        
        if (accuracy < 50) {
            return 'daily';
        } else if (accuracy < 70) {
            return 'every-other-day';
        } else if (accuracy < 90) {
            return 'twice-weekly';
        } else {
            return 'weekly';
        }
    }
    
    /**
     * Generate haptic pattern from braille dots
     * @private
     * @param {Array} dots - Braille dot pattern
     * @returns {Array} - Haptic vibration pattern
     */
    _generateHapticPattern(dots) {
        if (!dots || !Array.isArray(dots)) {
            return [];
        }
        
        // Convert dot pattern to vibration durations
        // Short vibration for dot, longer pause for space between characters
        const pattern = [];
        let cellIndex = 0;
        
        for (const dot of dots) {
            if (dot === 0) {
                // Space between characters
                pattern.push(0); // No vibration
                pattern.push(300); // Longer pause
                cellIndex = 0;
            } else {
                // Add vibration for each dot in the cell
                for (let i = 0; i < 6; i++) {
                    const bitMask = 1 << i;
                    if (dot & bitMask) {
                        // Dot is present
                        pattern.push(100); // Vibration
                    } else {
                        // Dot is absent
                        pattern.push(50); // Short pause
                    }
                    
                    // Add pause between dots
                    pattern.push(50);
                }
                
                // Add pause between cells
                pattern.push(150);
                cellIndex++;
            }
        }
        
        return pattern;
    }
    
    /**
     * Provide haptic feedback
     * @private
     * @param {boolean} isCorrect - Whether the answer is correct
     */
    _provideHapticFeedback(isCorrect) {
        if (!this.settings.hapticFeedback || !navigator.vibrate) {
            return;
        }
        
        try {
            if (isCorrect) {
                // Success pattern: two short vibrations
                navigator.vibrate([100, 50, 100]);
            } else {
                // Error pattern: one long vibration
                navigator.vibrate(300);
            }
        } catch (error) {
            console.error('Error providing haptic feedback:', error);
        }
    }
    
    /**
     * Calculate weighted average
     * @private
     * @param {number} oldValue - Old value
     * @param {number} newValue - New value
     * @param {number} newWeight - Weight for new value (0-1)
     * @returns {number} - Weighted average
     */
    _calculateWeightedAverage(oldValue, newValue, newWeight) {
        return (oldValue * (1 - newWeight)) + (newValue * newWeight);
    }
    
    /**
     * Generate a unique ID
     * @private
     * @returns {string} - Unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Sync learning state with MCP
     * @private
     */
    async _syncLearningState() {
        if (!this.mcpClient || !this.bbidManager) {
            return;
        }
        
        try {
            const currentDevice = this.bbidManager.getCurrentDevice();
            
            if (currentDevice && currentDevice.id) {
                await this.mcpClient.syncLearningProgress(
                    currentDevice.id,
                    {
                        level: this.learningState.level,
                        progress: this.learningState.progress,
                        accuracy: this.learningState.accuracy,
                        lastSession: this.learningState.lastSession,
                        sessionsCompleted: this.learningState.sessionsCompleted
                    }
                );
            }
        } catch (error) {
            console.error('Error syncing learning state:', error);
        }
    }
    
    /**
     * Dispatch an event
     * @private
     * @param {string} type - Event type
     * @param {Object} detail - Event details
     */
    _dispatchEvent(type, detail = {}) {
        const event = new CustomEvent(`brailleIdentityLearner:${type}`, {
            detail,
            bubbles: true
        });
        
        document.dispatchEvent(event);
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleIdentityLearner;
} else if (typeof window !== 'undefined') {
    window.BrailleIdentityLearner = BrailleIdentityLearner;
}
