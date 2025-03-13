/**
 * Sal - BrailleBuddy's AI Assistant
 * A helpful assistant that appears on all pages of the BrailleBuddy ecosystem
 * Inspired by Microsoft's Clippy but modernized for the web
 */

class Sal {
    constructor(options = {}) {
        this.options = Object.assign({
            greetingDelay: 2000,
            idleAnimationInterval: 15000,
            userIdentityProvider: null,
            container: document.body,
            position: 'bottom-right',
            bubbleDuration: 5000,
            enableDrag: true,
            initialMessage: 'Hi there! I\'m Sal, your BrailleBuddy assistant. How can I help you today?',
            debugMode: false
        }, options);

        // State
        this.isVisible = false;
        this.isSpeaking = false;
        this.currentAnimation = null;
        this.userIdentity = null;
        this.messageQueue = [];
        this.isProcessingQueue = false;
        this.idleAnimationTimer = null;
        this.dragState = {
            isDragging: false,
            initialX: 0,
            initialY: 0,
            offsetX: 0,
            offsetY: 0
        };

        // Elements
        this.element = null;
        this.characterElement = null;
        this.speechBubbleElement = null;
        
        // Behavioral fingerprinting integration
        this.behavioralData = null;
        this.deviceFingerprint = null;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize Sal
     */
    init() {
        this.createElements();
        this.attachEventListeners();
        this.loadUserIdentity();
        
        // Show Sal after a short delay
        setTimeout(() => {
            this.show();
            this.speak(this.options.initialMessage);
            this.startIdleAnimations();
        }, this.options.greetingDelay);
        
        // Initialize behavioral fingerprinting if available
        this.initBehavioralFingerprinting();
        
        if (this.options.debugMode) {
            console.log('Sal initialized with options:', this.options);
            window.sal = this; // Make accessible in console
        }
    }

    /**
     * Create the DOM elements for Sal
     */
    createElements() {
        // Main container
        this.element = document.createElement('div');
        this.element.className = 'sal-container';
        this.element.setAttribute('aria-live', 'polite');
        this.element.setAttribute('role', 'status');
        this.element.classList.add(`sal-${this.options.position}`);
        
        // Character element
        this.characterElement = document.createElement('div');
        this.characterElement.className = 'sal-character';
        
        // Character image
        const characterImage = document.createElement('img');
        characterImage.src = '/images/sal/sal-default.svg';
        characterImage.alt = 'Sal, your BrailleBuddy assistant';
        characterImage.className = 'sal-image';
        this.characterElement.appendChild(characterImage);
        
        // Speech bubble
        this.speechBubbleElement = document.createElement('div');
        this.speechBubbleElement.className = 'sal-speech-bubble';
        this.speechBubbleElement.style.display = 'none';
        
        // Close button for speech bubble
        const closeButton = document.createElement('button');
        closeButton.className = 'sal-close-bubble';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close message');
        closeButton.addEventListener('click', () => this.hideSpeechBubble());
        this.speechBubbleElement.appendChild(closeButton);
        
        // Speech content
        const speechContent = document.createElement('div');
        speechContent.className = 'sal-speech-content';
        this.speechBubbleElement.appendChild(speechContent);
        
        // Assemble and add to DOM
        this.element.appendChild(this.characterElement);
        this.element.appendChild(this.speechBubbleElement);
        this.options.container.appendChild(this.element);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Character click event
        this.characterElement.addEventListener('click', () => {
            if (this.speechBubbleElement.style.display === 'none') {
                this.speak('How can I help you with BrailleBuddy today?');
            } else {
                this.hideSpeechBubble();
            }
        });
        
        // Enable dragging if option is set
        if (this.options.enableDrag) {
            this.enableDragging();
        }
        
        // Listen for page navigation events
        window.addEventListener('popstate', () => this.onPageChange());
        
        // Listen for user interaction to gather behavioral data
        document.addEventListener('mousemove', this.onUserInteraction.bind(this));
        document.addEventListener('click', this.onUserInteraction.bind(this));
        document.addEventListener('keydown', this.onUserInteraction.bind(this));
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageReturn();
            }
        });
    }

    /**
     * Enable dragging functionality
     */
    enableDragging() {
        this.characterElement.addEventListener('mousedown', (e) => {
            this.dragState.isDragging = true;
            this.dragState.initialX = e.clientX;
            this.dragState.initialY = e.clientY;
            this.dragState.offsetX = this.element.offsetLeft;
            this.dragState.offsetY = this.element.offsetTop;
            
            this.element.classList.add('sal-dragging');
            
            // Remove position classes during drag
            this.element.classList.remove('sal-bottom-right', 'sal-bottom-left', 'sal-top-right', 'sal-top-left');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.dragState.isDragging) {
                const x = this.dragState.offsetX + (e.clientX - this.dragState.initialX);
                const y = this.dragState.offsetY + (e.clientY - this.dragState.initialY);
                
                this.element.style.left = `${x}px`;
                this.element.style.top = `${y}px`;
                this.element.style.bottom = 'auto';
                this.element.style.right = 'auto';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.dragState.isDragging) {
                this.dragState.isDragging = false;
                this.element.classList.remove('sal-dragging');
                
                // Save position preference (could be stored in localStorage)
                const position = {
                    left: this.element.style.left,
                    top: this.element.style.top
                };
                
                if (this.options.debugMode) {
                    console.log('Sal position updated:', position);
                }
            }
        });
    }

    /**
     * Load user identity from provider if available
     */
    loadUserIdentity() {
        if (this.options.userIdentityProvider && typeof this.options.userIdentityProvider === 'function') {
            Promise.resolve(this.options.userIdentityProvider())
                .then(identity => {
                    this.userIdentity = identity;
                    if (this.options.debugMode) {
                        console.log('User identity loaded:', this.userIdentity);
                    }
                    this.onIdentityLoaded();
                })
                .catch(error => {
                    console.error('Failed to load user identity:', error);
                });
        }
    }

    /**
     * Initialize behavioral fingerprinting
     */
    initBehavioralFingerprinting() {
        // Check if BBID behavioral fingerprinting is available
        if (window.BBIDBehavioral) {
            try {
                // Get device fingerprint if available
                if (window.DeviceFingerprint) {
                    DeviceFingerprint.load()
                        .then(fp => fp.get())
                        .then(result => {
                            this.deviceFingerprint = result;
                            this.startBehavioralTracking();
                        });
                } else {
                    // Generate a temporary ID if fingerprint not available
                    const tempId = 'user-' + Math.random().toString(36).substring(2, 15);
                    this.deviceFingerprint = { visitorId: tempId };
                    this.startBehavioralTracking();
                }
            } catch (error) {
                console.error('Error initializing behavioral fingerprinting:', error);
            }
        }
    }

    /**
     * Start behavioral tracking
     */
    startBehavioralTracking() {
        if (window.BBIDBehavioral && this.deviceFingerprint) {
            const behavioral = new BBIDBehavioral({
                deviceId: this.deviceFingerprint.visitorId,
                onFingerprintGenerated: (data) => {
                    this.behavioralData = data;
                    if (this.options.debugMode) {
                        console.log('Behavioral data updated:', data);
                    }
                }
            });
            
            behavioral.start();
        }
    }

    /**
     * Called when user identity is loaded
     */
    onIdentityLoaded() {
        if (this.userIdentity && this.userIdentity.name) {
            this.speak(`Welcome back, ${this.userIdentity.name}! Nice to see you again.`);
        }
    }

    /**
     * Handle user interaction for behavioral tracking
     */
    onUserInteraction(event) {
        // This could be used to update behavioral tracking or trigger Sal responses
        // For now, we'll just use it to detect activity for idle animations
        this.resetIdleAnimationTimer();
    }

    /**
     * Reset the idle animation timer
     */
    resetIdleAnimationTimer() {
        clearTimeout(this.idleAnimationTimer);
        this.idleAnimationTimer = setTimeout(() => {
            this.playIdleAnimation();
        }, this.options.idleAnimationInterval);
    }

    /**
     * Start idle animations
     */
    startIdleAnimations() {
        this.resetIdleAnimationTimer();
    }

    /**
     * Play a random idle animation
     */
    playIdleAnimation() {
        if (this.isSpeaking) return;
        
        const animations = ['blink', 'look-around', 'wave', 'think'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        this.playAnimation(randomAnimation);
        this.resetIdleAnimationTimer();
    }

    /**
     * Play a specific animation
     */
    playAnimation(animationName) {
        this.currentAnimation = animationName;
        this.characterElement.classList.add(`sal-animation-${animationName}`);
        
        // Remove the animation class after it completes
        setTimeout(() => {
            this.characterElement.classList.remove(`sal-animation-${animationName}`);
            this.currentAnimation = null;
        }, 2000); // Animation duration
    }

    /**
     * Make Sal speak a message
     */
    speak(message, duration = this.options.bubbleDuration) {
        // Add to queue
        this.messageQueue.push({
            message,
            duration
        });
        
        // Process queue if not already processing
        if (!this.isProcessingQueue) {
            this.processMessageQueue();
        }
    }

    /**
     * Process the message queue
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }
        
        this.isProcessingQueue = true;
        const { message, duration } = this.messageQueue.shift();
        
        // Show speech bubble with message
        this.showSpeechBubble(message);
        
        // Hide after duration if not -1 (persistent)
        if (duration !== -1) {
            setTimeout(() => {
                this.hideSpeechBubble();
                
                // Process next message after a short delay
                setTimeout(() => {
                    this.processMessageQueue();
                }, 500);
            }, duration);
        }
    }

    /**
     * Show the speech bubble with a message
     */
    showSpeechBubble(message) {
        const speechContent = this.speechBubbleElement.querySelector('.sal-speech-content');
        speechContent.innerHTML = message;
        this.speechBubbleElement.style.display = 'block';
        this.isSpeaking = true;
        
        // Play talking animation
        this.playAnimation('talk');
    }

    /**
     * Hide the speech bubble
     */
    hideSpeechBubble() {
        this.speechBubbleElement.style.display = 'none';
        this.isSpeaking = false;
    }

    /**
     * Show Sal
     */
    show() {
        this.element.style.display = 'block';
        this.isVisible = true;
        
        // Play entrance animation
        this.playAnimation('enter');
    }

    /**
     * Hide Sal
     */
    hide() {
        // Play exit animation then hide
        this.playAnimation('exit');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            this.isVisible = false;
        }, 1000);
    }

    /**
     * Called when page changes
     */
    onPageChange() {
        // Acknowledge the page change
        const pageName = document.title.split(' | ').pop() || 'this page';
        this.speak(`I see you're checking out ${pageName}. Let me know if you need help!`);
    }

    /**
     * Called when user returns to the page
     */
    onPageReturn() {
        if (document.hidden) return;
        
        // Welcome back if they've been gone a while
        this.speak('Welcome back! Need any assistance?');
    }

    /**
     * Provide contextual help based on current page
     */
    provideContextualHelp() {
        const currentPath = window.location.pathname;
        
        // Provide different help based on the current page
        if (currentPath.includes('/bbid/')) {
            this.speak('This is the BBID section, focused on identity verification through behavioral fingerprinting. Need help understanding how it works?');
        } else if (currentPath.includes('/bbes/')) {
            this.speak('You\'re in the BBES section, which deals with our braille-based encoding system. Would you like to learn more about semantic compression?');
        } else if (currentPath.includes('/motl/')) {
            this.speak('Welcome to the MOTL section! This is where AI systems communicate using dense semantic encoding. Can I explain any concepts?');
        } else if (currentPath.includes('/braillebuddy/')) {
            this.speak('This is the original BrailleBuddy game, designed to help learn braille in a fun way. Would you like to play?');
        } else {
            this.speak('How can I help you navigate the BrailleBuddy ecosystem today?');
        }
    }
}

// Initialize Sal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if BBID is available for identity
    const userIdentityProvider = () => {
        // Try to get identity from BBID if available
        if (window.BBID && typeof window.BBID.getIdentity === 'function') {
            return window.BBID.getIdentity();
        }
        
        // Try to get from device fingerprint if available
        if (window.DeviceFingerprint) {
            return DeviceFingerprint.load()
                .then(fp => fp.get())
                .then(result => {
                    return {
                        id: result.visitorId,
                        type: 'device',
                        confidence: 'medium'
                    };
                });
        }
        
        // Return anonymous if nothing else available
        return Promise.resolve({
            id: 'anonymous',
            type: 'anonymous',
            confidence: 'low'
        });
    };
    
    // Create global Sal instance
    window.salAssistant = new Sal({
        userIdentityProvider,
        debugMode: false
    });
});
