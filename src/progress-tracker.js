/**
 * BrailleBuddy Progress Tracking System
 * 
 * Implements personalized progress tracking with achievement system,
 * addressing the enhancement idea for personalized progress tracking.
 */

class ProgressTracker {
  constructor() {
    // User progress data
    this.userData = {
      userId: null,
      username: '',
      learningLevel: 1,
      totalCharactersLearned: 0,
      totalPracticeTime: 0, // in minutes
      lastSessionDate: null,
      consecutiveDays: 0,
      achievements: [],
      lessonProgress: {},
      characterMastery: {},
    };
    
    // Achievement definitions
    this.achievements = {
      // Milestone achievements
      firstCharacter: {
        id: 'first_character',
        title: 'First Steps',
        description: 'Learn your first braille character',
        icon: '🔤',
        unlocked: false,
        progress: 0,
        target: 1,
      },
      alphabetMaster: {
        id: 'alphabet_master',
        title: 'Alphabet Master',
        description: 'Learn all 26 letters of the braille alphabet',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        target: 26,
      },
      numberWizard: {
        id: 'number_wizard',
        title: 'Number Wizard',
        description: 'Learn all number symbols in braille',
        icon: '🔢',
        unlocked: false,
        progress: 0,
        target: 10,
      },
      punctuationPro: {
        id: 'punctuation_pro',
        title: 'Punctuation Pro',
        description: 'Master all punctuation marks in braille',
        icon: '❗',
        unlocked: false,
        progress: 0,
        target: 10,
      },
      
      // Engagement achievements
      dailyStreak: {
        id: 'daily_streak',
        title: 'Consistency is Key',
        description: 'Practice for 7 consecutive days',
        icon: '🔥',
        unlocked: false,
        progress: 0,
        target: 7,
      },
      practiceHours: {
        id: 'practice_hours',
        title: 'Dedicated Learner',
        description: 'Spend 10 hours practicing braille',
        icon: '⏱️',
        unlocked: false,
        progress: 0,
        target: 600, // in minutes
      },
      
      // Mastery achievements
      perfectScore: {
        id: 'perfect_score',
        title: 'Flawless',
        description: 'Complete a lesson with 100% accuracy',
        icon: '💯',
        unlocked: false,
        progress: 0,
        target: 1,
      },
      speedReader: {
        id: 'speed_reader',
        title: 'Speed Reader',
        description: 'Read 20 braille characters in under 30 seconds',
        icon: '⚡',
        unlocked: false,
        progress: 0,
        target: 1,
      },
      
      // Special achievements
      multilingualBraille: {
        id: 'multilingual_braille',
        title: 'Global Communicator',
        description: 'Practice braille in multiple languages',
        icon: '🌍',
        unlocked: false,
        progress: 0,
        target: 2, // number of languages
      },
      tactileTypist: {
        id: 'tactile_typist',
        title: 'Tactile Typist',
        description: 'Type 100 characters using the braille keyboard',
        icon: '👆',
        unlocked: false,
        progress: 0,
        target: 100,
      },
    };
    
    // Lesson definitions (simplified example)
    this.lessons = {
      // Level 1: Basic alphabet (a-j)
      'level1_intro': {
        id: 'level1_intro',
        title: 'Introduction to Braille',
        characters: [],
        completed: false,
        progress: 0,
      },
      'level1_aj': {
        id: 'level1_aj',
        title: 'Letters A-J',
        characters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        completed: false,
        progress: 0,
      },
      
      // Level 2: More alphabet (k-t)
      'level2_kt': {
        id: 'level2_kt',
        title: 'Letters K-T',
        characters: ['k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'],
        completed: false,
        progress: 0,
        prerequisite: 'level1_aj',
      },
      
      // Level 3: Completing the alphabet (u-z)
      'level3_uz': {
        id: 'level3_uz',
        title: 'Letters U-Z',
        characters: ['u', 'v', 'w', 'x', 'y', 'z'],
        completed: false,
        progress: 0,
        prerequisite: 'level2_kt',
      },
      
      // Level 4: Numbers
      'level4_numbers': {
        id: 'level4_numbers',
        title: 'Numbers in Braille',
        characters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        completed: false,
        progress: 0,
        prerequisite: 'level3_uz',
      },
      
      // Level 5: Punctuation
      'level5_punctuation': {
        id: 'level5_punctuation',
        title: 'Punctuation Marks',
        characters: ['.', ',', ';', ':', '!', '?', '"', '(', ')', '-'],
        completed: false,
        progress: 0,
        prerequisite: 'level4_numbers',
      },
      
      // Level 6: Contractions (Grade 2 Braille introduction)
      'level6_contractions': {
        id: 'level6_contractions',
        title: 'Introduction to Contractions',
        characters: ['and', 'for', 'of', 'the', 'with'],
        completed: false,
        progress: 0,
        prerequisite: 'level5_punctuation',
      },
    };
    
    // Load user data if available
    this._loadUserData();
  }

  /**
   * Initialize a new user profile
   * @param {string} username - User's name
   * @returns {Object} - User data object
   */
  initializeUser(username) {
    // Generate a unique user ID
    const userId = 'user_' + Date.now();
    
    this.userData = {
      userId,
      username: username || 'Learner',
      learningLevel: 1,
      totalCharactersLearned: 0,
      totalPracticeTime: 0,
      lastSessionDate: new Date().toISOString(),
      consecutiveDays: 1,
      achievements: [],
      lessonProgress: {},
      characterMastery: {},
    };
    
    // Initialize lesson progress
    Object.keys(this.lessons).forEach(lessonId => {
      this.userData.lessonProgress[lessonId] = {
        started: false,
        completed: false,
        progress: 0,
        bestScore: 0,
        attempts: 0,
        timeSpent: 0,
      };
    });
    
    // Save the new user data
    this._saveUserData();
    
    console.log(`New user profile created: ${username}`);
    return this.userData;
  }

  /**
   * Start a learning session
   * @returns {Object} - Session info
   */
  startSession() {
    const currentDate = new Date();
    const lastDate = this.userData.lastSessionDate ? new Date(this.userData.lastSessionDate) : null;
    
    // Check if this is a new day
    if (lastDate) {
      const isNewDay = 
        currentDate.getDate() !== lastDate.getDate() ||
        currentDate.getMonth() !== lastDate.getMonth() ||
        currentDate.getFullYear() !== lastDate.getFullYear();
      
      // Check if consecutive day
      if (isNewDay) {
        const timeDiff = currentDate.getTime() - lastDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        if (dayDiff === 1) {
          // Consecutive day
          this.userData.consecutiveDays += 1;
          
          // Check for daily streak achievement
          this._updateAchievement('dailyStreak', this.userData.consecutiveDays);
        } else if (dayDiff > 1) {
          // Streak broken
          this.userData.consecutiveDays = 1;
        }
      }
    }
    
    // Update last session date
    this.userData.lastSessionDate = currentDate.toISOString();
    this._saveUserData();
    
    return {
      userId: this.userData.userId,
      username: this.userData.username,
      learningLevel: this.userData.learningLevel,
      consecutiveDays: this.userData.consecutiveDays,
      sessionStartTime: currentDate,
    };
  }

  /**
   * End a learning session
   * @param {number} timeSpent - Time spent in minutes
   * @returns {Object} - Session summary
   */
  endSession(timeSpent) {
    // Update total practice time
    this.userData.totalPracticeTime += timeSpent;
    
    // Check for practice time achievement
    this._updateAchievement('practiceHours', this.userData.totalPracticeTime);
    
    // Save user data
    this._saveUserData();
    
    return {
      timeSpent,
      totalPracticeTime: this.userData.totalPracticeTime,
      newAchievements: this._getNewAchievements(),
    };
  }

  /**
   * Record progress for a specific lesson
   * @param {string} lessonId - Lesson identifier
   * @param {number} progress - Progress percentage (0-100)
   * @param {number} score - Score percentage (0-100)
   * @param {number} timeSpent - Time spent in minutes
   * @returns {Object} - Updated lesson progress
   */
  recordLessonProgress(lessonId, progress, score, timeSpent) {
    if (!this.lessons[lessonId]) {
      console.error(`Lesson ${lessonId} not found`);
      return null;
    }
    
    // Initialize lesson progress if not exists
    if (!this.userData.lessonProgress[lessonId]) {
      this.userData.lessonProgress[lessonId] = {
        started: false,
        completed: false,
        progress: 0,
        bestScore: 0,
        attempts: 0,
        timeSpent: 0,
      };
    }
    
    const lessonProgress = this.userData.lessonProgress[lessonId];
    
    // Mark as started
    if (!lessonProgress.started) {
      lessonProgress.started = true;
    }
    
    // Update progress
    lessonProgress.progress = Math.max(lessonProgress.progress, progress);
    
    // Update best score
    lessonProgress.bestScore = Math.max(lessonProgress.bestScore, score);
    
    // Increment attempts
    lessonProgress.attempts += 1;
    
    // Add time spent
    lessonProgress.timeSpent += timeSpent;
    
    // Mark as completed if progress is 100%
    if (progress >= 100 && !lessonProgress.completed) {
      lessonProgress.completed = true;
      
      // Update total characters learned
      this.userData.totalCharactersLearned += this.lessons[lessonId].characters.length;
      
      // Check for character-based achievements
      if (lessonId === 'level1_aj') {
        this._updateAchievement('alphabetMaster', 10); // 10 out of 26 letters
      } else if (lessonId === 'level2_kt') {
        this._updateAchievement('alphabetMaster', 20); // 20 out of 26 letters
      } else if (lessonId === 'level3_uz') {
        this._updateAchievement('alphabetMaster', 26); // All 26 letters
      } else if (lessonId === 'level4_numbers') {
        this._updateAchievement('numberWizard', 10); // All 10 numbers
      } else if (lessonId === 'level5_punctuation') {
        this._updateAchievement('punctuationPro', 10); // All punctuation marks
      }
      
      // Check if this unlocks a new level
      this._checkLevelProgression();
    }
    
    // Check for perfect score achievement
    if (score === 100) {
      this._updateAchievement('perfectScore', 1);
    }
    
    // Save user data
    this._saveUserData();
    
    return {
      lessonId,
      progress: lessonProgress.progress,
      bestScore: lessonProgress.bestScore,
      attempts: lessonProgress.attempts,
      completed: lessonProgress.completed,
      newAchievements: this._getNewAchievements(),
    };
  }

  /**
   * Record character mastery level
   * @param {string} character - The braille character
   * @param {number} masteryLevel - Mastery level (0-100)
   * @returns {Object} - Updated character mastery
   */
  recordCharacterMastery(character, masteryLevel) {
    // Initialize character mastery if not exists
    if (!this.userData.characterMastery[character]) {
      this.userData.characterMastery[character] = {
        masteryLevel: 0,
        practiceCount: 0,
        lastPracticed: null,
      };
      
      // If this is the first character ever, unlock the achievement
      if (Object.keys(this.userData.characterMastery).length === 1) {
        this._updateAchievement('firstCharacter', 1);
      }
    }
    
    const charMastery = this.userData.characterMastery[character];
    
    // Update mastery level (higher value wins)
    charMastery.masteryLevel = Math.max(charMastery.masteryLevel, masteryLevel);
    
    // Increment practice count
    charMastery.practiceCount += 1;
    
    // Update last practiced date
    charMastery.lastPracticed = new Date().toISOString();
    
    // Save user data
    this._saveUserData();
    
    return {
      character,
      masteryLevel: charMastery.masteryLevel,
      practiceCount: charMastery.practiceCount,
    };
  }

  /**
   * Record tactile typing progress
   * @param {number} characterCount - Number of characters typed
   * @returns {Object} - Updated achievement progress
   */
  recordTactileTyping(characterCount) {
    // Update tactile typist achievement
    const achievement = this.achievements.tactileTypist;
    const currentProgress = achievement.progress;
    
    this._updateAchievement('tactileTypist', currentProgress + characterCount);
    
    // Save user data
    this._saveUserData();
    
    return {
      achievement: 'tactileTypist',
      progress: this.achievements.tactileTypist.progress,
      target: this.achievements.tactileTypist.target,
      unlocked: this.achievements.tactileTypist.unlocked,
    };
  }

  /**
   * Record multilingual braille practice
   * @param {string} language - Language code (e.g., 'en', 'fr', 'es')
   * @returns {Object} - Updated achievement progress
   */
  recordMultilingualPractice(language) {
    // Track languages practiced
    if (!this.userData.languagesPracticed) {
      this.userData.languagesPracticed = [];
    }
    
    // Add language if not already tracked
    if (!this.userData.languagesPracticed.includes(language)) {
      this.userData.languagesPracticed.push(language);
      
      // Update multilingual achievement
      this._updateAchievement('multilingualBraille', this.userData.languagesPracticed.length);
    }
    
    // Save user data
    this._saveUserData();
    
    return {
      achievement: 'multilingualBraille',
      progress: this.achievements.multilingualBraille.progress,
      target: this.achievements.multilingualBraille.target,
      unlocked: this.achievements.multilingualBraille.unlocked,
      languages: this.userData.languagesPracticed,
    };
  }

  /**
   * Record speed reading achievement
   * @param {number} characterCount - Number of characters read
   * @param {number} timeSeconds - Time taken in seconds
   * @returns {Object} - Updated achievement progress
   */
  recordSpeedReading(characterCount, timeSeconds) {
    // Check if qualifies for speed reader achievement (20 chars in under 30 seconds)
    if (characterCount >= 20 && timeSeconds < 30) {
      this._updateAchievement('speedReader', 1);
      
      // Save user data
      this._saveUserData();
      
      return {
        achievement: 'speedReader',
        unlocked: true,
        characterCount,
        timeSeconds,
      };
    }
    
    return {
      achievement: 'speedReader',
      unlocked: this.achievements.speedReader.unlocked,
      characterCount,
      timeSeconds,
    };
  }

  /**
   * Get all available lessons
   * @param {boolean} includeProgress - Whether to include user progress
   * @returns {Array} - List of lessons
   */
  getLessons(includeProgress = true) {
    const lessonList = Object.values(this.lessons).map(lesson => {
      const result = { ...lesson };
      
      if (includeProgress && this.userData.lessonProgress[lesson.id]) {
        result.userProgress = this.userData.lessonProgress[lesson.id];
      }
      
      return result;
    });
    
    return lessonList;
  }

  /**
   * Get available lessons for the current user level
   * @returns {Array} - List of available lessons
   */
  getAvailableLessons() {
    const userLevel = this.userData.learningLevel;
    
    return Object.values(this.lessons)
      .filter(lesson => {
        // Check if lesson has a prerequisite
        if (lesson.prerequisite) {
          // Check if prerequisite is completed
          const prerequisiteCompleted = 
            this.userData.lessonProgress[lesson.prerequisite] &&
            this.userData.lessonProgress[lesson.prerequisite].completed;
          
          return prerequisiteCompleted;
        }
        
        // Lessons without prerequisites are available at level 1
        return true;
      })
      .map(lesson => {
        return {
          ...lesson,
          userProgress: this.userData.lessonProgress[lesson.id] || {
            started: false,
            completed: false,
            progress: 0,
          },
        };
      });
  }

  /**
   * Get all achievements with progress
   * @returns {Array} - List of achievements
   */
  getAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Get unlocked achievements
   * @returns {Array} - List of unlocked achievements
   */
  getUnlockedAchievements() {
    return Object.values(this.achievements).filter(achievement => achievement.unlocked);
  }

  /**
   * Get user statistics
   * @returns {Object} - User statistics
   */
  getUserStats() {
    // Calculate completion percentage
    const totalLessons = Object.keys(this.lessons).length;
    const completedLessons = Object.values(this.userData.lessonProgress)
      .filter(progress => progress.completed).length;
    
    const completionPercentage = totalLessons > 0 ? 
      Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Calculate average mastery level
    const masteryLevels = Object.values(this.userData.characterMastery)
      .map(mastery => mastery.masteryLevel);
    
    const averageMastery = masteryLevels.length > 0 ? 
      Math.round(masteryLevels.reduce((sum, level) => sum + level, 0) / masteryLevels.length) : 0;
    
    return {
      userId: this.userData.userId,
      username: this.userData.username,
      learningLevel: this.userData.learningLevel,
      totalCharactersLearned: this.userData.totalCharactersLearned,
      totalPracticeTime: this.userData.totalPracticeTime,
      consecutiveDays: this.userData.consecutiveDays,
      completedLessons,
      totalLessons,
      completionPercentage,
      averageMastery,
      achievementsUnlocked: this.getUnlockedAchievements().length,
      totalAchievements: Object.keys(this.achievements).length,
    };
  }

  /**
   * Get recommended next lessons
   * @returns {Array} - List of recommended lessons
   */
  getRecommendedLessons() {
    const availableLessons = this.getAvailableLessons();
    
    // Filter for incomplete lessons
    const incompleteLessons = availableLessons.filter(
      lesson => !lesson.userProgress.completed
    );
    
    // Sort by progress (prioritize lessons already started)
    return incompleteLessons.sort((a, b) => {
      // Prioritize started lessons
      if (a.userProgress.started && !b.userProgress.started) return -1;
      if (!a.userProgress.started && b.userProgress.started) return 1;
      
      // Then sort by progress (higher progress first)
      return b.userProgress.progress - a.userProgress.progress;
    });
  }

  /**
   * Get characters that need practice
   * @param {number} limit - Maximum number of characters to return
   * @returns {Array} - List of characters needing practice
   */
  getCharactersNeedingPractice(limit = 5) {
    // Get all characters with mastery data
    const characters = Object.keys(this.userData.characterMastery);
    
    // Sort by mastery level (ascending) and last practiced (oldest first)
    const sortedChars = characters.sort((a, b) => {
      const masteryA = this.userData.characterMastery[a].masteryLevel;
      const masteryB = this.userData.characterMastery[b].masteryLevel;
      
      // First sort by mastery level
      if (masteryA !== masteryB) {
        return masteryA - masteryB;
      }
      
      // Then by last practiced date
      const lastA = new Date(this.userData.characterMastery[a].lastPracticed);
      const lastB = new Date(this.userData.characterMastery[b].lastPracticed);
      
      return lastA - lastB;
    });
    
    // Return the top characters needing practice
    return sortedChars.slice(0, limit).map(char => ({
      character: char,
      masteryLevel: this.userData.characterMastery[char].masteryLevel,
      lastPracticed: this.userData.characterMastery[char].lastPracticed,
    }));
  }

  /**
   * Reset user progress (for testing)
   */
  resetProgress() {
    // Keep user ID and name, reset everything else
    const userId = this.userData.userId;
    const username = this.userData.username;
    
    this.initializeUser(username);
    this.userData.userId = userId;
    
    this._saveUserData();
    
    console.log('User progress has been reset');
    return this.userData;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Update achievement progress
   * @param {string} achievementId - Achievement identifier
   * @param {number} progress - New progress value
   * @private
   */
  _updateAchievement(achievementId, progress) {
    const achievement = this.achievements[achievementId];
    
    if (!achievement) {
      console.error(`Achievement ${achievementId} not found`);
      return;
    }
    
    // Update progress
    achievement.progress = Math.max(achievement.progress, progress);
    
    // Check if achievement is unlocked
    if (!achievement.unlocked && achievement.progress >= achievement.target) {
      achievement.unlocked = true;
      
      // Add to user's unlocked achievements if not already there
      if (!this.userData.achievements.includes(achievementId)) {
        this.userData.achievements.push(achievementId);
        
        // Mark as new achievement
        achievement.isNew = true;
      }
    }
  }

  /**
   * Check if user should level up
   * @private
   */
  _checkLevelProgression() {
    const currentLevel = this.userData.learningLevel;
    let shouldLevelUp = false;
    
    // Level up criteria based on completed lessons
    switch (currentLevel) {
      case 1:
        // Level up to 2 if level1_aj is completed
        shouldLevelUp = this.userData.lessonProgress.level1_aj && 
                        this.userData.lessonProgress.level1_aj.completed;
        break;
      case 2:
        // Level up to 3 if level2_kt is completed
        shouldLevelUp = this.userData.lessonProgress.level2_kt && 
                        this.userData.lessonProgress.level2_kt.completed;
        break;
      case 3:
        // Level up to 4 if level3_uz is completed
        shouldLevelUp = this.userData.lessonProgress.level3_uz && 
                        this.userData.lessonProgress.level3_uz.completed;
        break;
      case 4:
        // Level up to 5 if level4_numbers is completed
        shouldLevelUp = this.userData.lessonProgress.level4_numbers && 
                        this.userData.lessonProgress.level4_numbers.completed;
        break;
      case 5:
        // Level up to 6 if level5_punctuation is completed
        shouldLevelUp = this.userData.lessonProgress.level5_punctuation && 
                        this.userData.lessonProgress.level5_punctuation.completed;
        break;
    }
    
    if (shouldLevelUp) {
      this.userData.learningLevel += 1;
      console.log(`User leveled up to level ${this.userData.learningLevel}`);
    }
  }

  /**
   * Get newly unlocked achievements
   * @returns {Array} - List of new achievements
   * @private
   */
  _getNewAchievements() {
    const newAchievements = Object.values(this.achievements)
      .filter(achievement => achievement.isNew);
    
    // Clear new flag
    newAchievements.forEach(achievement => {
      achievement.isNew = false;
    });
    
    return newAchievements;
  }

  /**
   * Save user data to localStorage
   * @private
   */
  _saveUserData() {
    try {
      localStorage.setItem('brailleBuddy_userData', JSON.stringify(this.userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  /**
   * Load user data from localStorage
   * @private
   */
  _loadUserData() {
    try {
      const savedData = localStorage.getItem('brailleBuddy_userData');
      if (savedData) {
        this.userData = JSON.parse(savedData);
        console.log('User data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}

export default ProgressTracker;
