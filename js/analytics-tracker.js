/**
 * BrailleBuddy Analytics & Data Storage System
 * 
 * Tracks all user interactions, learning progress, and system events
 * Stores data locally and optionally syncs to server
 */

class BrailleBuddyAnalytics {
    constructor(options = {}) {
        this.options = {
            enableLocalStorage: options.enableLocalStorage !== false,
            enableIndexedDB: options.enableIndexedDB !== false,
            enableServerSync: options.enableServerSync || false,
            serverEndpoint: options.serverEndpoint || '/api/analytics',
            batchSize: options.batchSize || 50,
            syncInterval: options.syncInterval || 60000, // 1 minute
            debug: options.debug || false,
            ...options
        };

        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.eventQueue = [];
        this.db = null;

        this.init();
    }

    /**
     * Initialize analytics system
     */
    async init() {
        if (this.options.enableIndexedDB) {
            await this.initIndexedDB();
        }

        // Track session start
        this.trackEvent('session_start', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            platform: navigator.platform
        });

        // Set up auto-sync
        if (this.options.enableServerSync) {
            this.startAutoSync();
        }

        // Track page visibility
        this.setupVisibilityTracking();

        // Track errors
        this.setupErrorTracking();

        // Track performance
        this.trackPerformance();

        this.log('Analytics initialized');
    }

    /**
     * Initialize IndexedDB for persistent storage
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BrailleBuddyDB', 1);

            request.onerror = () => {
                this.log('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.log('IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Events store
                if (!db.objectStoreNames.contains('events')) {
                    const eventsStore = db.createObjectStore('events', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    eventsStore.createIndex('eventType', 'eventType', { unique: false });
                    eventsStore.createIndex('sessionId', 'sessionId', { unique: false });
                }

                // User progress store
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    progressStore.createIndex('userId', 'userId', { unique: false });
                    progressStore.createIndex('activity', 'activity', { unique: false });
                }

                // Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { 
                        keyPath: 'sessionId' 
                    });
                    sessionsStore.createIndex('userId', 'userId', { unique: false });
                    sessionsStore.createIndex('startTime', 'startTime', { unique: false });
                }

                // Achievements store
                if (!db.objectStoreNames.contains('achievements')) {
                    const achievementsStore = db.createObjectStore('achievements', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    achievementsStore.createIndex('userId', 'userId', { unique: false });
                    achievementsStore.createIndex('achievementType', 'achievementType', { unique: false });
                }
            };
        });
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get or create user ID
     */
    getUserId() {
        let userId = localStorage.getItem('braillebuddy_user_id');
        
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('braillebuddy_user_id', userId);
        }
        
        return userId;
    }

    /**
     * Track an event
     */
    async trackEvent(eventType, data = {}) {
        const event = {
            eventType,
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            data: data
        };

        this.eventQueue.push(event);

        // Store in localStorage
        if (this.options.enableLocalStorage) {
            this.storeInLocalStorage(event);
        }

        // Store in IndexedDB
        if (this.options.enableIndexedDB && this.db) {
            await this.storeInIndexedDB('events', event);
        }

        // Batch sync if queue is full
        if (this.eventQueue.length >= this.options.batchSize) {
            await this.syncToServer();
        }

        this.log('Event tracked:', eventType, data);
    }

    /**
     * Track learning activity
     */
    async trackLearning(activity, details = {}) {
        await this.trackEvent('learning_activity', {
            activity,
            ...details
        });

        // Update progress
        await this.updateProgress(activity, details);
    }

    /**
     * Track practice session
     */
    async trackPractice(mode, results = {}) {
        await this.trackEvent('practice_session', {
            mode,
            score: results.score,
            correct: results.correct,
            incorrect: results.incorrect,
            duration: results.duration,
            ...results
        });
    }

    /**
     * Track game play
     */
    async trackGame(gameName, results = {}) {
        await this.trackEvent('game_played', {
            game: gameName,
            score: results.score,
            level: results.level,
            duration: results.duration,
            ...results
        });
    }

    /**
     * Track braille interaction
     */
    async trackBrailleInteraction(type, data = {}) {
        await this.trackEvent('braille_interaction', {
            interactionType: type,
            ...data
        });
    }

    /**
     * Track translation
     */
    async trackTranslation(from, to, inputLength, outputLength) {
        await this.trackEvent('translation', {
            from,
            to,
            inputLength,
            outputLength,
            compressionRatio: outputLength / inputLength
        });
    }

    /**
     * Track settings change
     */
    async trackSettingsChange(setting, oldValue, newValue) {
        await this.trackEvent('settings_change', {
            setting,
            oldValue,
            newValue
        });
    }

    /**
     * Track achievement unlocked
     */
    async trackAchievement(achievementType, details = {}) {
        const achievement = {
            userId: this.userId,
            achievementType,
            timestamp: new Date().toISOString(),
            ...details
        };

        await this.trackEvent('achievement_unlocked', achievement);

        if (this.db) {
            await this.storeInIndexedDB('achievements', achievement);
        }
    }

    /**
     * Update user progress
     */
    async updateProgress(activity, details = {}) {
        const progress = {
            userId: this.userId,
            activity,
            timestamp: new Date().toISOString(),
            ...details
        };

        if (this.db) {
            await this.storeInIndexedDB('progress', progress);
        }

        // Update localStorage summary
        this.updateProgressSummary(activity, details);
    }

    /**
     * Update progress summary in localStorage
     */
    updateProgressSummary(activity, details) {
        const summaryKey = 'braillebuddy_progress_summary';
        let summary = JSON.parse(localStorage.getItem(summaryKey) || '{}');

        if (!summary[activity]) {
            summary[activity] = {
                count: 0,
                totalScore: 0,
                bestScore: 0,
                lastActivity: null
            };
        }

        summary[activity].count++;
        summary[activity].lastActivity = new Date().toISOString();

        if (details.score) {
            summary[activity].totalScore += details.score;
            summary[activity].bestScore = Math.max(
                summary[activity].bestScore, 
                details.score
            );
        }

        localStorage.setItem(summaryKey, JSON.stringify(summary));
    }

    /**
     * Store event in localStorage
     */
    storeInLocalStorage(event) {
        const key = 'braillebuddy_events';
        let events = JSON.parse(localStorage.getItem(key) || '[]');
        
        events.push(event);
        
        // Keep only last 1000 events
        if (events.length > 1000) {
            events = events.slice(-1000);
        }
        
        localStorage.setItem(key, JSON.stringify(events));
    }

    /**
     * Store data in IndexedDB
     */
    async storeInIndexedDB(storeName, data) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get events from IndexedDB
     */
    async getEvents(filter = {}) {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            const request = store.getAll();

            request.onsuccess = () => {
                let events = request.result;
                
                // Apply filters
                if (filter.eventType) {
                    events = events.filter(e => e.eventType === filter.eventType);
                }
                if (filter.startDate) {
                    events = events.filter(e => new Date(e.timestamp) >= new Date(filter.startDate));
                }
                if (filter.endDate) {
                    events = events.filter(e => new Date(e.timestamp) <= new Date(filter.endDate));
                }
                
                resolve(events);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get user progress
     */
    async getProgress() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const index = store.index('userId');
            const request = index.getAll(this.userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get achievements
     */
    async getAchievements() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['achievements'], 'readonly');
            const store = transaction.objectStore('achievements');
            const index = store.index('userId');
            const request = index.getAll(this.userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Sync data to server
     */
    async syncToServer() {
        if (!this.options.enableServerSync || this.eventQueue.length === 0) {
            return;
        }

        const eventsToSync = [...this.eventQueue];
        this.eventQueue = [];

        try {
            const response = await fetch(this.options.serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    sessionId: this.sessionId,
                    events: eventsToSync
                })
            });

            if (!response.ok) {
                throw new Error(`Server sync failed: ${response.status}`);
            }

            this.log('Synced', eventsToSync.length, 'events to server');
        } catch (error) {
            this.log('Server sync error:', error);
            // Re-add events to queue
            this.eventQueue.unshift(...eventsToSync);
        }
    }

    /**
     * Start automatic sync
     */
    startAutoSync() {
        setInterval(() => {
            this.syncToServer();
        }, this.options.syncInterval);
    }

    /**
     * Setup visibility tracking
     */
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('unhandled_promise_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const metrics = {
                        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                        domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
                        tcpTime: timing.connectEnd - timing.connectStart,
                        requestTime: timing.responseEnd - timing.requestStart,
                        renderTime: timing.domComplete - timing.domLoading
                    };

                    this.trackEvent('performance_metrics', metrics);
                }, 0);
            });
        }
    }

    /**
     * Get analytics summary
     */
    async getSummary() {
        const events = await this.getEvents();
        const progress = await this.getProgress();
        const achievements = await this.getAchievements();

        const summary = {
            totalEvents: events.length,
            totalSessions: new Set(events.map(e => e.sessionId)).size,
            eventsByType: {},
            progressByActivity: {},
            totalAchievements: achievements.length,
            firstVisit: events.length > 0 ? events[0].timestamp : null,
            lastVisit: events.length > 0 ? events[events.length - 1].timestamp : null
        };

        // Count events by type
        events.forEach(event => {
            summary.eventsByType[event.eventType] = 
                (summary.eventsByType[event.eventType] || 0) + 1;
        });

        // Count progress by activity
        progress.forEach(p => {
            summary.progressByActivity[p.activity] = 
                (summary.progressByActivity[p.activity] || 0) + 1;
        });

        return summary;
    }

    /**
     * Export all data
     */
    async exportData() {
        const events = await this.getEvents();
        const progress = await this.getProgress();
        const achievements = await this.getAchievements();
        const summary = await this.getSummary();

        return {
            userId: this.userId,
            exportDate: new Date().toISOString(),
            summary,
            events,
            progress,
            achievements
        };
    }

    /**
     * Clear all data
     */
    async clearData() {
        // Clear localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('braillebuddy_')) {
                localStorage.removeItem(key);
            }
        });

        // Clear IndexedDB
        if (this.db) {
            const stores = ['events', 'progress', 'sessions', 'achievements'];
            for (const storeName of stores) {
                await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        }

        this.log('All data cleared');
    }

    /**
     * Log debug messages
     */
    log(...args) {
        if (this.options.debug) {
            console.log('[BrailleBuddy Analytics]', ...args);
        }
    }
}

// Global instance
let analytics = null;

/**
 * Initialize analytics
 */
function initAnalytics(options = {}) {
    if (!analytics) {
        analytics = new BrailleBuddyAnalytics(options);
    }
    return analytics;
}

/**
 * Get analytics instance
 */
function getAnalytics() {
    if (!analytics) {
        analytics = initAnalytics();
    }
    return analytics;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleBuddyAnalytics, initAnalytics, getAnalytics };
}
