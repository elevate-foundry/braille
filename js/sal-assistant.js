/**
 * Sal Assistant - A talking BrailleFST assistant for BrailleBuddy
 * 
 * This module implements a friendly talking assistant named Sal (after Salus)
 * that uses the BrailleFST system to communicate with users through speech.
 * Sal greets users when they visit the BrailleBuddy website and can provide
 * helpful information about braille and the application.
 */

class SalAssistant {
    constructor(options = {}) {
        // Default options
        this.options = {
            voice: null,  // Will be set during initialization
            rate: 1.0,    // Speech rate
            pitch: 1.0,   // Speech pitch
            volume: 0.8,  // Speech volume
            language: 'en-US', // Default language
            autoGreet: true, // Automatically greet on page load
            ...options
        };
        
        // Initialize properties
        this.brailleFST = null;
        this.speaking = false;
        this.initialized = false;
        this.greetingDisplayed = false;
        this.speechSynthesis = window.speechSynthesis;
        this.availableVoices = [];
        this.bbidManager = null;
        this.userIdentified = false;
        this.currentBBID = null;
        
        // Greetings in different languages
        this.greetings = {
            'en': [
                "Hi there! I'm Sal, your BrailleBuddy assistant. I'm here to help you learn braille!",
                "Welcome to BrailleBuddy! I'm Sal, and I'll be your guide to the fascinating world of braille.",
                "Hello! My name is Sal. I'm powered by BrailleFST technology and I'm excited to help you explore braille today!"
            ],
            'es': [
                "¡Hola! Soy Sal, tu asistente de BrailleBuddy. ¡Estoy aquí para ayudarte a aprender braille!",
                "¡Bienvenido a BrailleBuddy! Soy Sal, y seré tu guía en el fascinante mundo del braille."
            ],
            'fr': [
                "Bonjour! Je suis Sal, votre assistant BrailleBuddy. Je suis là pour vous aider à apprendre le braille!",
                "Bienvenue sur BrailleBuddy! Je m'appelle Sal, et je serai votre guide dans le monde fascinant du braille."
            ],
            'zh': [
                "你好！我是Sal，你的BrailleBuddy助手。我在这里帮助你学习盲文！",
                "欢迎来到BrailleBuddy！我是Sal，我将成为你探索盲文奇妙世界的向导。"
            ],
            'ar': [
                "مرحبًا! أنا سال، مساعدك في BrailleBuddy. أنا هنا لمساعدتك في تعلم برايل!",
                "مرحبًا بك في BrailleBuddy! أنا سال، وسأكون دليلك إلى عالم برايل المذهل."
            ],
            'hi': [
                "नमस्ते! मैं सैल हूँ, आपका BrailleBuddy सहायक। मैं आपको ब्रेल सीखने में मदद करने के लिए यहाँ हूँ!",
                "BrailleBuddy में आपका स्वागत है! मैं सैल हूँ, और मैं आपको ब्रेल के रोमांचक संसार में मार्गदर्शन करूँगा।"
            ]
        };
        
        // Initialize the assistant
        this._initialize();
    }
    
    /**
     * Initialize the Sal assistant
     * @private
     */
    async _initialize() {
        try {
            console.log('DEBUG [1]: Starting Sal initialization');
            // Wait for voices to be loaded
            if (this.speechSynthesis.getVoices().length === 0) {
                console.log('DEBUG [2]: Waiting for voices to load');
                await new Promise(resolve => {
                    this.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
                    // Fallback if event doesn't fire
                    setTimeout(resolve, 1000);
                });
            }
            
            // Get available voices
            this.availableVoices = this.speechSynthesis.getVoices();
            console.log('DEBUG [3]: Loaded', this.availableVoices.length, 'voices');
            
            // Select a default voice based on language
            this._selectVoice(this.options.language);
            console.log('DEBUG [4]: Selected voice:', this.options.voice ? this.options.voice.name : 'No voice available');
            
            // Create BrailleFST instance if not provided
            if (!this.brailleFST) {
                // Check if BrailleFST is available
                if (typeof BrailleFST !== 'undefined') {
                    console.log('DEBUG [5]: BrailleFST is available, creating instance');
                    this.brailleFST = new BrailleFST({
                        grade: 2,
                        language: this.options.language.split('-')[0]
                    });
                } else {
                    console.warn('DEBUG [5a]: BrailleFST not available. Sal will operate with limited functionality.');
                }
            }
            
            // Connect to BBID Manager if available
            if (typeof window.bbidManager !== 'undefined') {
                console.log('DEBUG [6]: BBID Manager found, connecting');
                this.bbidManager = window.bbidManager;
                
                // Check if BBID Manager is initialized
                if (!this.bbidManager.initialized) {
                    console.log('DEBUG [7]: Initializing BBID Manager');
                    await this.bbidManager.initialize();
                }
                
                // Check if user is already identified
                this.currentBBID = this.bbidManager.getCurrentDevice();
                if (this.currentBBID) {
                    this.userIdentified = true;
                    console.log('DEBUG [8]: User identified via BBID:', this.currentBBID.metadata?.name || 'Unknown');
                } else {
                    console.log('DEBUG [8a]: No current BBID found');
                }
                
                // Listen for BBID events
                console.log('DEBUG [9]: Adding BBID event listeners');
                document.addEventListener('bbid:deviceSaved', this._onBBIDDeviceSaved.bind(this));
                document.addEventListener('bbid:deviceRemoved', this._onBBIDDeviceRemoved.bind(this));
            } else {
                console.warn('DEBUG [6a]: BBID Manager not available. Creating a new instance.');
                // Create BBID Manager if it doesn't exist
                if (typeof BBIDManager !== 'undefined') {
                    window.bbidManager = new BBIDManager();
                    this.bbidManager = window.bbidManager;
                    await this.bbidManager.initialize();
                    console.log('DEBUG [6b]: Created new BBID Manager instance');
                    
                    // Listen for BBID events
                    document.addEventListener('bbid:deviceSaved', this._onBBIDDeviceSaved.bind(this));
                    document.addEventListener('bbid:deviceRemoved', this._onBBIDDeviceRemoved.bind(this));
                } else {
                    console.error('DEBUG [6c]: BBIDManager class not available');
                }
            }
            
            // Create UI elements
            console.log('DEBUG [10]: Creating UI elements');
            this._createUI();
            
            // Set initialized flag
            this.initialized = true;
            
            // Auto-greet if enabled
            if (this.options.autoGreet) {
                // Slight delay to ensure page has loaded
                console.log('DEBUG [11]: Setting up auto-greeting');
                setTimeout(() => {
                    console.log('DEBUG [12]: Auto-greeting now');
                    this.greet();
                }, 1500);
            }
            
            console.log('DEBUG [13]: Sal Assistant initialized successfully!');
        } catch (error) {
            console.error('DEBUG [ERROR]: Error initializing Sal Assistant:', error);
        }
    }
    
    /**
     * Select a voice based on language
     * @param {string} language - Language code (e.g., 'en-US')
     * @private
     */
    _selectVoice(language) {
        // Try to find a voice that matches the language
        const langCode = language.split('-')[0]; // Get base language code
        
        // First try to find a voice that exactly matches the language
        let voice = this.availableVoices.find(v => v.lang === language);
        
        // If not found, try to find a voice that matches the base language
        if (!voice) {
            voice = this.availableVoices.find(v => v.lang.startsWith(langCode));
        }
        
        // If still not found, use the first available voice
        if (!voice && this.availableVoices.length > 0) {
            voice = this.availableVoices[0];
        }
        
        this.options.voice = voice;
    }
    
    /**
     * Create UI elements for Sal
     * @private
     */
    _createUI() {
        // Create Sal container
        const salContainer = document.createElement('div');
        salContainer.id = 'sal-assistant';
        salContainer.className = 'sal-assistant';
        
        // Create Sal avatar
        const salAvatar = document.createElement('div');
        salAvatar.className = 'sal-avatar';
        salAvatar.innerHTML = `
            <div class="sal-face">
                <div class="sal-eyes">
                    <div class="sal-eye"></div>
                    <div class="sal-eye"></div>
                </div>
                <div class="sal-mouth"></div>
            </div>
        `;
        
        // Create Sal speech bubble
        const salSpeech = document.createElement('div');
        salSpeech.className = 'sal-speech';
        salSpeech.innerHTML = `
            <p id="sal-message">Hi, I'm Sal!</p>
        `;
        
        // Create Sal controls
        const salControls = document.createElement('div');
        salControls.className = 'sal-controls';
        salControls.innerHTML = `
            <button id="sal-speak" title="Ask Sal to speak">
                <span class="sr-only">Speak</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h4v-1a5 5 0 0 0-10 0v10a1 1 0 1 1-2 0V10a7 7 0 0 1 14 0v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v1a7 7 0 0 1-14 0V10a5 5 0 0 0 10 0v1a1 1 0 0 1-1 1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-7a7 7 0 1 0-14 0v11a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1h-3a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h3v-2a9 9 0 0 0-18 0v7a5 5 0 0 0 10 0v-1a3 3 0 0 0-6 0v4a1 1 0 1 1-2 0v-4a5 5 0 0 1 10 0v1a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h1v-1a5 5 0 0 0-5-5z"/>
                </svg>
            </button>
            <button id="sal-mute" title="Mute Sal">
                <span class="sr-only">Mute</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M15 4.58l-2.25-1.5A1.5 1.5 0 0 0 11 4.5v15a1.5 1.5 0 0 0 1.75 1.42L15 19.42V4.58zM4.48 4.48A1 1 0 0 0 3 5.59V18.4a1 1 0 0 0 1.48 1.11l4.02-2.7v-9.6L4.48 4.48zm14.04 0L13.5 9.5v5l5.02 5.02a1 1 0 0 0 1.48-1.11V5.59a1 1 0 0 0-1.48-1.11z"/>
                </svg>
            </button>
            <button id="sal-identity" title="Identify yourself to Sal">
                <span class="sr-only">Identify</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
            </button>
        `;
        
        // Append elements to container
        salContainer.appendChild(salAvatar);
        salContainer.appendChild(salSpeech);
        salContainer.appendChild(salControls);
        
        // Create BBID identification panel (hidden by default)
        const bbidPanel = document.createElement('div');
        bbidPanel.id = 'sal-bbid-panel';
        bbidPanel.className = 'sal-bbid-panel';
        bbidPanel.innerHTML = `
            <div class="sal-bbid-header">
                <h3>Identify Yourself to Sal</h3>
                <button id="sal-bbid-close" class="sal-bbid-close" title="Close">&times;</button>
            </div>
            <div class="sal-bbid-content">
                <div class="sal-bbid-section">
                    <h4>Create New Identity</h4>
                    <div class="sal-bbid-form">
                        <input type="text" id="sal-bbid-name" placeholder="Enter your name or device name" />
                        <button id="sal-bbid-create">Create</button>
                    </div>
                </div>
                <div class="sal-bbid-section">
                    <h4>Import Identity</h4>
                    <div class="sal-bbid-form">
                        <input type="file" id="sal-bbid-file" accept=".bbid" />
                        <button id="sal-bbid-import">Import</button>
                    </div>
                </div>
                <div id="sal-bbid-devices" class="sal-bbid-section">
                    <h4>Saved Identities</h4>
                    <div class="sal-bbid-devices-list">
                        <p id="sal-bbid-no-devices">No saved identities found.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Append BBID panel to body
        document.body.appendChild(bbidPanel);
        
        // Add event listeners
        document.getElementById('sal-speak').addEventListener('click', () => this.speak());
        document.getElementById('sal-mute').addEventListener('click', () => this.toggleMute());
        document.getElementById('sal-identity').addEventListener('click', () => this._toggleBBIDPanel());
        document.getElementById('sal-bbid-close').addEventListener('click', () => this._toggleBBIDPanel(false));
        document.getElementById('sal-bbid-create').addEventListener('click', () => this._handleCreateBBID());
        document.getElementById('sal-bbid-import').addEventListener('click', () => this._handleImportBBID());
        
        // Populate devices list if BBID manager is available
        if (this.bbidManager && this.bbidManager.initialized) {
            this._populateDevicesList();
        } else if (this.bbidManager) {
            // Wait for initialization
            document.addEventListener('bbid:initialized', () => this._populateDevicesList());
        }
        
        // Add styles
        this._addStyles();
    }
    
    /**
     * Add CSS styles for Sal
     * @private
     */
    _addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .sal-assistant {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                align-items: flex-end;
                z-index: 1000;
                font-family: 'Comic Neue', sans-serif;
            }
            
            .sal-avatar {
                width: 60px;
                height: 60px;
                background-color: #4a6fa5;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            .sal-avatar:hover {
                transform: scale(1.05);
            }
            
            .sal-face {
                width: 40px;
                height: 40px;
                position: relative;
            }
            
            .sal-eyes {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
            }
            
            .sal-eye {
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
            }
            
            .sal-mouth {
                width: 20px;
                height: 6px;
                background-color: white;
                border-radius: 10px;
                margin: 8px auto 0;
                transition: all 0.3s ease;
            }
            
            .sal-speaking .sal-mouth {
                height: 10px;
                border-radius: 50%;
            }
            
            .sal-speech {
                background-color: white;
                border-radius: 20px;
                padding: 10px 15px;
                margin-right: 10px;
                max-width: 250px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                position: relative;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                display: none;
            }
            
            .sal-speech:after {
                content: '';
                position: absolute;
                right: -10px;
                bottom: 20px;
                width: 0;
                height: 0;
                border-left: 10px solid white;
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
            }
            
            .sal-speech.active {
                opacity: 1;
                transform: translateY(0);
                display: block;
            }
            
            .sal-controls {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
            }
            
            .sal-controls button {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: none;
                background-color: #4a6fa5;
                color: white;
                cursor: pointer;
                margin-bottom: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: all 0.2s ease;
            }
            
            .sal-controls button:hover {
                background-color: #3a5a8f;
                transform: scale(1.1);
            }
            
            .sal-controls button svg {
                width: 16px;
                height: 16px;
                fill: white;
            }
            
            /* BBID Panel Styles */
            .sal-bbid-panel {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 320px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 999;
                overflow: hidden;
                display: none;
                font-family: 'Comic Neue', sans-serif;
            }
            
            .sal-bbid-panel.active {
                display: block;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .sal-bbid-header {
                background-color: #4a6fa5;
                color: white;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .sal-bbid-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .sal-bbid-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .sal-bbid-content {
                padding: 15px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .sal-bbid-section {
                margin-bottom: 20px;
            }
            
            .sal-bbid-section h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            
            .sal-bbid-form {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .sal-bbid-form input {
                flex: 1;
                padding: 8px 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            
            .sal-bbid-form button {
                background-color: #4a6fa5;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .sal-bbid-form button:hover {
                background-color: #3a5a8f;
            }
            
            .sal-bbid-devices-list {
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid #eee;
                border-radius: 5px;
                padding: 10px;
            }
            
            .sal-bbid-device-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid #eee;
            }
            
            .sal-bbid-device-item:last-child {
                border-bottom: none;
            }
            
            .sal-bbid-device-info {
                flex: 1;
            }
            
            .sal-bbid-device-name {
                font-weight: 600;
                margin: 0 0 3px 0;
                font-size: 14px;
            }
            
            .sal-bbid-device-meta {
                font-size: 12px;
                color: #666;
                margin: 0;
            }
            
            .sal-bbid-device-actions {
                display: flex;
                gap: 5px;
            }
            
            .sal-bbid-device-actions button {
                background-color: #4a6fa5;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
            }
            
            .sal-bbid-device-actions button:hover {
                background-color: #3a5a8f;
            }
            
            .sal-bbid-device-actions button.delete {
                background-color: #e74c3c;
            }
            
            .sal-bbid-device-actions button.delete:hover {
                background-color: #c0392b;
            }
            
            #sal-bbid-no-devices {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin: 10px 0;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }
            
            @media (max-width: 768px) {
                .sal-assistant {
                    bottom: 10px;
                    right: 10px;
                }
                
                .sal-speech {
                    max-width: 200px;
                }
                
                .sal-bbid-panel {
                    width: 290px;
                    bottom: 80px;
                    right: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Get device information for personalized greetings
     * @private
     * @returns {Object} - Object containing device information
     */
    async _getDeviceInfo() {
        console.log('DEBUG [DEVICE-1]: Getting device information');
        const deviceInfo = {
            name: 'your device',
            type: 'unknown',
            os: 'unknown',
            browser: 'unknown',
            processor: 'unknown',
            location: null
        };
        
        // Get device name from BBID if available
        if (this.currentBBID && this.currentBBID.metadata) {
            deviceInfo.name = this.currentBBID.metadata.name || deviceInfo.name;
            deviceInfo.type = this.currentBBID.metadata.type || deviceInfo.type;
            deviceInfo.os = this.currentBBID.metadata.os || deviceInfo.os;
        }
        
        // Get more detailed device information
        const userAgent = navigator.userAgent;
        
        // Detect OS with more detail
        if (/Windows NT 10.0/i.test(userAgent)) deviceInfo.os = 'Windows 10';
        else if (/Windows NT 6.3/i.test(userAgent)) deviceInfo.os = 'Windows 8.1';
        else if (/Windows NT 6.2/i.test(userAgent)) deviceInfo.os = 'Windows 8';
        else if (/Windows NT 6.1/i.test(userAgent)) deviceInfo.os = 'Windows 7';
        else if (/Mac OS X/i.test(userAgent)) {
            // Try to detect Mac model
            if (/Intel Mac OS X/i.test(userAgent)) {
                deviceInfo.os = 'macOS (Intel)';
            } else if (/Mac OS X.*AppleWebKit/i.test(userAgent)) {
                deviceInfo.os = 'macOS (Apple Silicon)';
                if (/Mac OS X.*AppleWebKit.*Safari/i.test(userAgent)) {
                    deviceInfo.os = 'Mac M1/M2';
                }
            }
        }
        else if (/Android/i.test(userAgent)) {
            const match = userAgent.match(/Android (\d+(\.\d+)*)/i);
            deviceInfo.os = match ? `Android ${match[1]}` : 'Android';
        }
        else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            const match = userAgent.match(/OS (\d+[_\d]*)/i);
            deviceInfo.os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
        }
        else if (/Linux/i.test(userAgent)) deviceInfo.os = 'Linux';
        
        // Detect browser
        if (/Chrome/i.test(userAgent) && !/Chromium|Edge|OPR|Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Chrome';
        } else if (/Firefox/i.test(userAgent)) {
            deviceInfo.browser = 'Firefox';
        } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edge|OPR|Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Safari';
        } else if (/Edge/i.test(userAgent)) {
            deviceInfo.browser = 'Edge';
        } else if (/OPR/i.test(userAgent)) {
            deviceInfo.browser = 'Opera';
        } else if (/Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Brave';
        }
        
        // Try to get processor information
        if (/Intel/i.test(userAgent)) {
            deviceInfo.processor = 'Intel';
        } else if (/ARM/i.test(userAgent)) {
            deviceInfo.processor = 'ARM';
        } else if (/AppleWebKit/i.test(userAgent) && /Mac/i.test(userAgent) && !/Intel/i.test(userAgent)) {
            deviceInfo.processor = 'Apple Silicon';
        }
        
        // Try to get location information (if geolocation is available)
        try {
            if (navigator.geolocation) {
                console.log('DEBUG [DEVICE-2]: Attempting to get location');
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 600000 // 10 minutes
                    });
                });
                
                // For privacy reasons, we'll just use approximate location (city level)
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Use a simple approximation for Salt Lake City area
                if (latitude >= 40.5 && latitude <= 41.0 && longitude >= -112.1 && longitude <= -111.7) {
                    deviceInfo.location = 'Salt Lake City, UT';
                }
                
                console.log('DEBUG [DEVICE-3]: Got location coordinates', latitude, longitude);
            }
        } catch (error) {
            console.warn('DEBUG [DEVICE-ERROR]: Error getting location', error);
        }
        
        console.log('DEBUG [DEVICE-4]: Device info collected', deviceInfo);
        return deviceInfo;
    }
    
    /**
     * Greet the user
     */
    async greet() {
        if (!this.initialized || this.greetingDisplayed) return;
        
        console.log('DEBUG [GREET-1]: Starting greeting process');
        
        // Check if user is identified
        if (this.userIdentified && this.currentBBID) {
            console.log('DEBUG [GREET-2]: User is identified, using personalized greeting');
            this._greetIdentifiedUser();
            return;
        }
        
        // Get device info for a more personalized greeting even without BBID
        const deviceInfo = await this._getDeviceInfo();
        
        // Get language code
        const langCode = this.options.language.split('-')[0];
        
        // Get greetings for the current language or fall back to English
        const greetingsForLang = this.greetings[langCode] || this.greetings['en'];
        
        // Select a random greeting
        let greeting = greetingsForLang[Math.floor(Math.random() * greetingsForLang.length)];
        
        // Add device info to greeting if available
        if (deviceInfo.os !== 'unknown') {
            greeting += ` I notice you're using ${deviceInfo.os} with ${deviceInfo.browser}.`;
            
            if (deviceInfo.location) {
                greeting += ` And it looks like you're in ${deviceInfo.location}!`;
            }
            
            greeting += " If you'd like me to remember you, click the identity button below.";
        }
        
        console.log('DEBUG [GREET-3]: Saying greeting:', greeting);
        
        // Speak the greeting
        this.say(greeting);
        
        // Mark greeting as displayed
        this.greetingDisplayed = true;
    }
    
    /**
     * Say something using speech synthesis
     * @param {string} text - Text to speak
     */
    say(text) {
        console.log('DEBUG [SAY-1]: Attempting to speak:', text);
        if (!this.initialized) {
            console.warn('DEBUG [SAY-2]: Not initialized, cannot speak');
            return;
        }
        
        if (!this.speechSynthesis) {
            console.warn('DEBUG [SAY-3]: No speech synthesis available');
            // Show message even if we can't speak
            this._updateUI(text, false);
            return;
        }
        
        // Stop any current speech
        this.stop();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        console.log('DEBUG [SAY-4]: Created utterance');
        
        // Set utterance properties
        utterance.voice = this.options.voice;
        utterance.rate = this.options.rate;
        utterance.pitch = this.options.pitch;
        utterance.volume = this.options.volume;
        
        // Set language
        utterance.lang = this.options.language;
        
        console.log('DEBUG [SAY-5]: Using voice:', utterance.voice?.name || 'Default', 'with volume:', utterance.volume);
        
        // Add event listeners
        utterance.onstart = () => {
            console.log('DEBUG [SAY-6]: Speech started');
            this.speaking = true;
            this._updateUI(text, true);
        };
        
        utterance.onend = () => {
            console.log('DEBUG [SAY-7]: Speech ended');
            this.speaking = false;
            setTimeout(() => {
                this._updateUI('', false);
            }, 2000);
        };
        
        utterance.onerror = (event) => {
            console.error('DEBUG [SAY-ERROR]: Speech synthesis error:', event);
            this.speaking = false;
            this._updateUI('', false);
        };
        
        // Always show the message in the UI, even if speech fails
        this._updateUI(text, true);
        
        // Speak the utterance
        try {
            console.log('DEBUG [SAY-8]: Attempting to speak now');
            this.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('DEBUG [SAY-ERROR-2]: Error speaking:', error);
        }
    }
    
    /**
     * Stop speaking
     */
    stop() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.speaking = false;
            this._updateUI('', false);
        }
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        if (this.options.volume > 0) {
            this.options.previousVolume = this.options.volume;
            this.options.volume = 0;
            this.stop();
        } else {
            this.options.volume = this.options.previousVolume || 0.8;
        }
        
        // Update mute button
        const muteButton = document.getElementById('sal-mute');
        if (muteButton) {
            muteButton.title = this.options.volume === 0 ? 'Unmute Sal' : 'Mute Sal';
        }
    }
    
    /**
     * Toggle BBID panel visibility
     * @param {boolean} [show] - Force show or hide
     * @private
     */
    _toggleBBIDPanel(show) {
        const panel = document.getElementById('sal-bbid-panel');
        if (show === undefined) {
            panel.classList.toggle('active');
        } else if (show) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
        
        // Refresh device list when showing panel
        if (panel.classList.contains('active') && this.bbidManager) {
            this._populateDevicesList();
        }
    }
    
    /**
     * Populate the devices list in the BBID panel
     * @private
     */
    _populateDevicesList() {
        if (!this.bbidManager) return;
        
        const devicesList = document.querySelector('.sal-bbid-devices-list');
        const noDevicesMsg = document.getElementById('sal-bbid-no-devices');
        
        // Clear existing devices
        const existingDevices = devicesList.querySelectorAll('.sal-bbid-device-item');
        existingDevices.forEach(device => device.remove());
        
        // Get all devices from BBID manager
        const devices = this.bbidManager.getDevices();
        
        if (devices && devices.length > 0) {
            noDevicesMsg.style.display = 'none';
            
            // Sort devices by last used date (most recent first)
            devices.sort((a, b) => {
                const dateA = new Date(a.metadata?.lastUsed || 0);
                const dateB = new Date(b.metadata?.lastUsed || 0);
                return dateB - dateA;
            });
            
            // Add each device to the list
            devices.forEach(device => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'sal-bbid-device-item';
                deviceItem.dataset.deviceId = device.id;
                
                const isCurrentDevice = device.id === this.bbidManager.getCurrentDevice()?.id;
                
                deviceItem.innerHTML = `
                    <div class="sal-bbid-device-info">
                        <p class="sal-bbid-device-name">${device.metadata?.name || 'Unnamed Device'} ${isCurrentDevice ? '(This Device)' : ''}</p>
                        <p class="sal-bbid-device-meta">${device.metadata?.type || 'Unknown'} • ${device.metadata?.os || 'Unknown OS'}</p>
                    </div>
                    <div class="sal-bbid-device-actions">
                        ${!isCurrentDevice ? `<button class="select" data-device-id="${device.id}">Select</button>` : ''}
                        <button class="export" data-device-id="${device.id}">Export</button>
                        <button class="delete" data-device-id="${device.id}">Remove</button>
                    </div>
                `;
                
                devicesList.appendChild(deviceItem);
                
                // Add event listeners for device actions
                const selectBtn = deviceItem.querySelector('button.select');
                if (selectBtn) {
                    selectBtn.addEventListener('click', () => this._handleSelectDevice(device.id));
                }
                
                const exportBtn = deviceItem.querySelector('button.export');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => this._handleExportDevice(device.id));
                }
                
                const deleteBtn = deviceItem.querySelector('button.delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this._handleRemoveDevice(device.id));
                }
            });
        } else {
            noDevicesMsg.style.display = 'block';
        }
    }
    
    /**
     * Handle creating a new BBID
     * @private
     */
    _handleCreateBBID() {
        if (!this.bbidManager) return;
        
        const nameInput = document.getElementById('sal-bbid-name');
        const deviceName = nameInput.value.trim();
        
        if (!deviceName) {
            this.showMessage('Please enter a name for your device.');
            return;
        }
        
        // Get device info
        const userAgent = navigator.userAgent;
        let deviceType = 'other';
        let deviceOS = 'other';
        
        // Detect device type
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) {
            deviceType = 'mobile';
        } else {
            deviceType = 'desktop';
        }
        
        // Detect OS
        if (/Windows/i.test(userAgent)) deviceOS = 'windows';
        else if (/Macintosh|Mac OS/i.test(userAgent)) deviceOS = 'macos';
        else if (/Linux/i.test(userAgent)) deviceOS = 'linux';
        else if (/Android/i.test(userAgent)) deviceOS = 'android';
        else if (/iPhone|iPad|iPod/i.test(userAgent)) deviceOS = 'ios';
        
        // Create BBID
        this.createBBID(deviceName)
            .then(success => {
                if (success) {
                    nameInput.value = '';
                    this._populateDevicesList();
                    this._toggleBBIDPanel(false);
                } else {
                    this.showMessage('Sorry, I couldn\'t create your identity. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error creating BBID:', error);
                this.showMessage('Sorry, I couldn\'t create your identity. Please try again.');
            });
    }
    
    /**
     * Handle importing a BBID file
     * @private
     */
    _handleImportBBID() {
        if (!this.bbidManager) return;
        
        const fileInput = document.getElementById('sal-bbid-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('Please select a BBID file to import.');
            return;
        }
        
        this.importBBIDAndIdentify(file)
            .then(success => {
                if (success) {
                    fileInput.value = '';
                    this._populateDevicesList();
                    this._toggleBBIDPanel(false);
                } else {
                    this.showMessage('Sorry, this BBID file appears to be invalid. Please try another.');
                }
            })
            .catch(error => {
                console.error('Error importing BBID:', error);
                this.showMessage('Sorry, this file is not a valid BBID file.');
            });
    }
    
    /**
     * Handle selecting a device as current
     * @param {string} deviceId - ID of the device to select
     * @private
     */
    _handleSelectDevice(deviceId) {
        this.identifyWithBBID(deviceId);
        this._toggleBBIDPanel(false);
    }
    
    /**
     * Handle exporting a device BBID
     * @param {string} deviceId - ID of the device to export
     * @private
     */
    _handleExportDevice(deviceId) {
        if (!this.bbidManager) return;
        
        const device = this.bbidManager.getDevices().find(d => d.id === deviceId);
        if (device) {
            this.bbidManager.exportBBID(deviceId);
            this.showMessage(`Exporting identity for ${device.metadata?.name || 'device'}.`);
        }
    }
    
    /**
     * Handle removing a device
     * @param {string} deviceId - ID of the device to remove
     * @private
     */
    _handleRemoveDevice(deviceId) {
        if (!this.bbidManager) return;
        
        const device = this.bbidManager.getDevices().find(d => d.id === deviceId);
        if (device) {
            if (confirm(`Are you sure you want to remove ${device.metadata?.name || 'this device'}?`)) {
                this.bbidManager.removeDevice(deviceId);
                this._populateDevicesList();
                this.showMessage(`I've forgotten about ${device.metadata?.name || 'that device'}.`);
            }
        }
    }
    
    /**
     * Show a message in the speech bubble without speaking
     * @param {string} text - Message to display
     */
    showMessage(text) {
        this._updateUI(text, false);
        setTimeout(() => {
            this._updateUI('', false);
        }, 5000);
    }
    
    /**
     * Update the UI based on speaking state
     * @param {string} text - Text being spoken
     * @param {boolean} speaking - Whether Sal is speaking
     * @private
     */
    _updateUI(text, speaking) {
        console.log('DEBUG [UI-1]: Updating UI with text:', text?.substring(0, 20) + (text?.length > 20 ? '...' : ''), 'speaking:', speaking);
        
        // Update avatar
        const salAvatar = document.querySelector('.sal-avatar');
        if (salAvatar) {
            if (speaking) {
                salAvatar.classList.add('sal-speaking');
            } else {
                salAvatar.classList.remove('sal-speaking');
            }
            console.log('DEBUG [UI-2]: Updated avatar speaking state');
        } else {
            console.warn('DEBUG [UI-ERROR]: Avatar element not found');
        }
        
        // Update speech bubble
        const salSpeech = document.querySelector('.sal-speech');
        const salMessage = document.getElementById('sal-message');
        
        if (salSpeech && salMessage) {
            if (text) {
                salMessage.textContent = text;
                salSpeech.classList.add('active');
                console.log('DEBUG [UI-3]: Speech bubble activated');
            } else {
                setTimeout(() => {
                    salSpeech.classList.remove('active');
                    console.log('DEBUG [UI-4]: Speech bubble deactivated');
                }, 500);
            }
        } else {
            console.warn('DEBUG [UI-ERROR]: Speech or message elements not found', 
                        'speech:', !!salSpeech, 'message:', !!salMessage);
        }
    }
    
    /**
     * Set the language for Sal
     * @param {string} language - Language code (e.g., 'en-US')
     */
    setLanguage(language) {
        this.options.language = language;
        this._selectVoice(language);
        
        // Update BrailleFST language if available
        if (this.brailleFST) {
            this.brailleFST.options.language = language.split('-')[0];
        }
    }
    
    /**
     * Speak about braille
     */
    speakAboutBraille() {
        const brailleInfo = {
            'en': "Braille is a tactile writing system used by people who are visually impaired. It was invented by Louis Braille in 1824. Each braille character is made up of 6 dots arranged in a 2x3 grid, allowing for 64 possible combinations.",
            'es': "El braille es un sistema de escritura táctil utilizado por personas con discapacidad visual. Fue inventado por Louis Braille en 1824. Cada carácter braille está formado por 6 puntos dispuestos en una cuadrícula de 2x3, lo que permite 64 combinaciones posibles.",
            'fr': "Le braille est un système d'écriture tactile utilisé par les personnes malvoyantes. Il a été inventé par Louis Braille en 1824. Chaque caractère braille est composé de 6 points disposés dans une grille 2x3, permettant 64 combinaisons possibles.",
            'zh': "盲文是一种由视障人士使用的触觉书写系统。它由路易斯·布莱叶于1824年发明。每个盲文字符由排列在2x3网格中的6个点组成，允许64种可能的组合。",
            'ar': "برايل هو نظام كتابة لمسي يستخدمه الأشخاص ذوو الإعاقة البصرية. تم اختراعه بواسطة لويس برايل في عام 1824. يتكون كل حرف برايل من 6 نقاط مرتبة في شبكة 2 × 3 ، مما يسمح بـ 64 مجموعة محتملة.",
            'hi': "ब्रेल एक स्पर्श लेखन प्रणाली है जिसका उपयोग दृष्टिबाधित लोगों द्वारा किया जाता है। इसका आविष्कार लुई ब्रेल ने 1824 में किया था। प्रत्येक ब्रेल वर्ण 2x3 ग्रिड में व्यवस्थित 6 बिंदुओं से बना होता है, जिससे 64 संभावित संयोजन संभव हैं।"
        };
        
        const langCode = this.options.language.split('-')[0];
        const info = brailleInfo[langCode] || brailleInfo['en'];
        
        this.say(info);
    }
    
    /**
     * Speak about BrailleBuddy
     */
    speakAboutBrailleBuddy() {
        const appInfo = {
            'en': "BrailleBuddy is an interactive web application designed to help users learn and practice braille in a fun and engaging way. It features haptic feedback, games, and adaptive learning to make the learning experience enjoyable and effective.",
            'es': "BrailleBuddy es una aplicación web interactiva diseñada para ayudar a los usuarios a aprender y practicar braille de una manera divertida y atractiva. Cuenta con retroalimentación háptica, juegos y aprendizaje adaptativo para hacer que la experiencia de aprendizaje sea agradable y efectiva.",
            'fr': "BrailleBuddy est une application web interactive conçue pour aider les utilisateurs à apprendre et à pratiquer le braille de manière amusante et engageante. Elle propose un retour haptique, des jeux et un apprentissage adaptatif pour rendre l'expérience d'apprentissage agréable et efficace.",
            'zh': "BrailleBuddy是一款交互式网络应用程序，旨在以有趣和吸引人的方式帮助用户学习和练习盲文。它具有触觉反馈、游戏和自适应学习功能，使学习体验愉快且有效。",
            'ar': "BrailleBuddy هو تطبيق ويب تفاعلي مصمم لمساعدة المستخدمين على تعلم وممارسة طريقة برايل بطريقة ممتعة وجذابة. يتميز بردود الفعل اللمسية والألعاب والتعلم التكيفي لجعل تجربة التعلم ممتعة وفعالة.",
            'hi': "BrailleBuddy एक इंटरैक्टिव वेब एप्लिकेशन है जो उपयोगकर्ताओं को मज़ेदार और आकर्षक तरीके से ब्रेल सीखने और अभ्यास करने में मदद करने के लिए डिज़ाइन किया गया है। इसमें हैप्टिक फीडबैक, गेम्स और अनुकूली लर्निंग शामिल हैं जो सीखने के अनुभव को आनंददायक और प्रभावी बनाते हैं।"
        };
        
        const langCode = this.options.language.split('-')[0];
        const info = appInfo[langCode] || appInfo['en'];
        
        this.say(info);
    }
    
    /**
     * BBID Event Handlers
     */
    
    /**
     * Handle BBID device saved event
     * @param {CustomEvent} event - The BBID device saved event
     * @private
     */
    _onBBIDDeviceSaved(event) {
        const device = event.detail.device;
        
        // Update current BBID if it matches the current device
        if (this.bbidManager && this.bbidManager.getCurrentDevice() && 
            this.bbidManager.getCurrentDevice().id === device.id) {
            this.currentBBID = device;
            this.userIdentified = true;
            
            // Greet the user by name if this is a new identification
            if (!this.greetingDisplayed) {
                this._greetIdentifiedUser();
            }
        }
    }
    
    /**
     * Handle BBID device removed event
     * @param {CustomEvent} event - The BBID device removed event
     * @private
     */
    _onBBIDDeviceRemoved(event) {
        const deviceId = event.detail.deviceId;
        
        // If the removed device is the current one, update state
        if (this.currentBBID && this.currentBBID.id === deviceId) {
            this.currentBBID = null;
            this.userIdentified = false;
        }
    }
    
    /**
     * Greet an identified user by name
     * @private
     */
    async _greetIdentifiedUser() {
        if (!this.currentBBID || !this.currentBBID.metadata || !this.currentBBID.metadata.name) return;
        
        console.log('DEBUG [GREET-ID-1]: Getting personalized greeting for identified user');
        
        // Get detailed device info
        const deviceInfo = await this._getDeviceInfo();
        const deviceName = this.currentBBID.metadata.name;
        const langCode = this.options.language.split('-')[0];
        
        let greeting;
        
        // Base greeting by language
        switch(langCode) {
            case 'es':
                greeting = `¡Bienvenido de nuevo, ${deviceName}!`;
                break;
            case 'fr':
                greeting = `Bon retour, ${deviceName}!`;
                break;
            case 'zh':
                greeting = `欢迎回来，${deviceName}！`;
                break;
            case 'ar':
                greeting = `مرحبًا بعودتك، ${deviceName}!`;
                break;
            case 'hi':
                greeting = `वापस आने पर स्वागत है, ${deviceName}!`;
                break;
            case 'en':
            default:
                greeting = `Welcome back, ${deviceName}!`;
                break;
        }
        
        // Add device and location information for English only (to keep it simple)
        if (langCode === 'en') {
            // Add OS and browser info
            if (deviceInfo.os !== 'unknown') {
                greeting += ` I see you're using your ${deviceInfo.os}`;
                
                if (deviceInfo.browser !== 'unknown') {
                    greeting += ` with ${deviceInfo.browser} browser`;
                }
                
                greeting += ".";
            }
            
            // Add location if available
            if (deviceInfo.location) {
                greeting += ` I notice you're located in ${deviceInfo.location}.`;
            }
            
            // Add a friendly closing
            greeting += " It's great to see you again! How can I help you today?";
        }
        
        console.log('DEBUG [GREET-ID-2]: Personalized greeting:', greeting);
        
        this.say(greeting);
        this.greetingDisplayed = true;
    }
    
    /**
     * Identify user with BBID
     * @param {string} deviceId - The BBID device ID to identify with
     * @returns {boolean} - True if identification was successful, false otherwise
     */
    identifyWithBBID(deviceId) {
        if (!this.bbidManager) return false;
        
        const device = this.bbidManager.getDevices().find(d => d.id === deviceId);
        
        if (device) {
            this.currentBBID = device;
            this.userIdentified = true;
            this._greetIdentifiedUser();
            return true;
        }
        
        return false;
    }
    
    /**
     * Import a BBID from file and identify the user
     * @param {File} file - The BBID file to import
     * @returns {Promise<boolean>} - Promise resolving to true if successful, false otherwise
     */
    async importBBIDAndIdentify(file) {
        if (!this.bbidManager) return false;
        
        try {
            const bbid = await this.bbidManager.importBBID(file);
            if (bbid) {
                this.currentBBID = bbid;
                this.userIdentified = true;
                this._greetIdentifiedUser();
                return true;
            }
        } catch (error) {
            console.error('Error importing BBID:', error);
        }
        
        return false;
    }
    
    /**
     * Create a new BBID for the current device
     * @param {string} deviceName - User-friendly name for the device
     * @returns {Promise<boolean>} - Promise resolving to true if successful, false otherwise
     */
    async createBBID(deviceName) {
        if (!this.bbidManager) return false;
        
        try {
            // Generate and save BBID
            const bbid = await this.bbidManager.generateBBID(deviceName);
            this.bbidManager.saveBBID(bbid);
            
            // Update current BBID
            this.currentBBID = bbid;
            this.userIdentified = true;
            
            // Greet the user
            const langCode = this.options.language.split('-')[0];
            let message;
            
            switch(langCode) {
                case 'es':
                    message = `¡Gracias ${deviceName}! Ahora te reconoceré cuando vuelvas a visitarme.`;
                    break;
                case 'fr':
                    message = `Merci ${deviceName}! Je te reconnaîtrai maintenant quand tu reviendras me voir.`;
                    break;
                case 'zh':
                    message = `谢谢${deviceName}！现在我会在你再次访问时认出你。`;
                    break;
                case 'ar':
                    message = `شكرًا لك ${deviceName}! سأتعرف عليك الآن عندما تزورني مرة أخرى.`;
                    break;
                case 'hi':
                    message = `धन्यवाद ${deviceName}! अब मैं आपको पहचानूंगा जब आप मुझसे फिर मिलने आएंगे।`;
                    break;
                case 'en':
                default:
                    message = `Thank you ${deviceName}! I'll now recognize you when you come back to visit me.`;
                    break;
            }
            
            this.say(message);
            return true;
        } catch (error) {
            console.error('Error creating BBID:', error);
        }
        
        return false;
    }
}

// Create and export Sal instance
let salAssistant;

// Debug function to check if Sal is working
function debugSal() {
    console.log('DEBUG [GLOBAL-1]: Checking Sal status');
    if (!window.salAssistant) {
        console.error('DEBUG [GLOBAL-ERROR]: Sal not initialized yet');
        return;
    }
    
    console.log('DEBUG [GLOBAL-2]: Sal initialized:', window.salAssistant.initialized);
    console.log('DEBUG [GLOBAL-3]: BBID Manager available:', !!window.salAssistant.bbidManager);
    console.log('DEBUG [GLOBAL-4]: User identified:', window.salAssistant.userIdentified);
    console.log('DEBUG [GLOBAL-5]: Current BBID:', window.salAssistant.currentBBID);
    
    // Test speaking
    window.salAssistant.say('Debug test: I am Sal, and I am working now!');
}

// Comprehensive debug function with options
function debugSalAdvanced(option) {
    console.log('DEBUG [ADVANCED-1]: Running advanced debug with option:', option);
    if (!window.salAssistant) {
        console.error('DEBUG [ADVANCED-ERROR]: Sal not initialized yet');
        return;
    }
    
    switch(option) {
        case 'status':
            // Show detailed status information
            console.log('DEBUG [ADVANCED-STATUS-1]: Sal detailed status:');
            console.log('- Initialized:', window.salAssistant.initialized);
            console.log('- BBID Manager:', !!window.salAssistant.bbidManager);
            console.log('- User identified:', window.salAssistant.userIdentified);
            console.log('- Current BBID:', window.salAssistant.currentBBID);
            console.log('- Voice loaded:', !!window.salAssistant.options.voice);
            console.log('- Voice name:', window.salAssistant.options.voice?.name);
            console.log('- Language:', window.salAssistant.options.language);
            console.log('- Greeting displayed:', window.salAssistant.greetingDisplayed);
            console.log('- Speaking:', window.salAssistant.speaking);
            
            // Test basic speaking
            window.salAssistant.say('Status check complete!');
            break;
            
        case 'greet':
            // Force a new greeting (reset greeting flag first)
            console.log('DEBUG [ADVANCED-GREET-1]: Testing greeting functionality');
            window.salAssistant.greetingDisplayed = false;
            window.salAssistant.greet();
            break;
            
        case 'identify':
            // Test identification with BBID
            console.log('DEBUG [ADVANCED-IDENTIFY-1]: Testing BBID identification');
            if (window.salAssistant.bbidManager) {
                // Force re-identification of current device
                window.salAssistant.bbidManager.identifyCurrentDevice();
                
                // Get current device and greet
                const currentDevice = window.salAssistant.bbidManager.getCurrentDevice();
                if (currentDevice) {
                    console.log('DEBUG [ADVANCED-IDENTIFY-2]: Device identified:', currentDevice.metadata?.name);
                    window.salAssistant.currentBBID = currentDevice;
                    window.salAssistant.userIdentified = true;
                    window.salAssistant.greetingDisplayed = false;
                    window.salAssistant._greetIdentifiedUser();
                } else {
                    console.log('DEBUG [ADVANCED-IDENTIFY-3]: No device identified, creating test device');
                    // Create a test device if none exists
                    const createTestDevice = confirm('No device identified. Create a test device with enhanced information?');
                    if (createTestDevice) {
                        const userName = prompt('Enter a name for this device:', 'Test User');
                        if (userName) {
                            // Use the new createTestBBID method for enhanced device info
                            window.salAssistant.createTestBBID(userName);
                        }
                    }
                }
            } else {
                console.error('DEBUG [ADVANCED-IDENTIFY-ERROR]: BBID Manager not available');
            }
            break;
            
        case 'deviceInfo':
            // Show detailed device information
            console.log('DEBUG [ADVANCED-DEVICE-1]: Getting detailed device information');
            if (window.salAssistant.bbidManager) {
                const deviceInfo = window.salAssistant.bbidManager.detectDeviceInfo();
                console.log('DEBUG [ADVANCED-DEVICE-2]: Device information:', deviceInfo);
                
                // Test speaking device info
                const deviceInfoText = `I've detected that you're using a ${deviceInfo.type} running ${deviceInfo.os} ${deviceInfo.osVersion} with ${deviceInfo.browser} browser.`;
                window.salAssistant.say(deviceInfoText);
            } else {
                console.error('DEBUG [ADVANCED-DEVICE-ERROR]: BBID Manager not available');
            }
            break;
            
        case 'reset':
            // Reset Sal's state for testing
            console.log('DEBUG [ADVANCED-RESET-1]: Resetting Sal state');
            window.salAssistant.greetingDisplayed = false;
            window.salAssistant.userIdentified = false;
            window.salAssistant.currentBBID = null;
            window.salAssistant.say('I have reset my state. I no longer recognize you.');
            break;
            
        default:
            // Run basic test
            console.log('DEBUG [ADVANCED-DEFAULT-1]: Running basic test');
            window.salAssistant.say('Advanced debug test: I am Sal, and I am working now!');
            break;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DEBUG [INIT-1]: DOM Content Loaded, creating Sal');
    // Create Sal instance
    salAssistant = new SalAssistant();
    
    // Make Sal globally accessible
    window.salAssistant = salAssistant;
    
    // Add debug buttons to the page
    setTimeout(() => {
        // Create debug panel container
        const debugPanel = document.createElement('div');
        debugPanel.id = 'sal-debug-panel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.top = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.display = 'flex';
        debugPanel.style.flexDirection = 'column';
        debugPanel.style.gap = '5px';
        
        // Basic debug button
        const debugButton = document.createElement('button');
        debugButton.id = 'sal-debug';
        debugButton.textContent = 'Debug Sal';
        debugButton.style.padding = '5px 10px';
        debugButton.style.backgroundColor = '#ff5722';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '4px';
        debugButton.style.cursor = 'pointer';
        debugButton.addEventListener('click', debugSal);
        debugPanel.appendChild(debugButton);
        
        // Advanced debug buttons
        const createDebugButton = (text, option, color) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.padding = '5px 10px';
            btn.style.backgroundColor = color;
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => debugSalAdvanced(option));
            return btn;
        };
        
        // Add various debug buttons
        debugPanel.appendChild(createDebugButton('Test Greeting', 'greet', '#4CAF50'));
        debugPanel.appendChild(createDebugButton('Test Identification', 'identify', '#2196F3'));
        debugPanel.appendChild(createDebugButton('Device Info', 'deviceInfo', '#9C27B0'));
        debugPanel.appendChild(createDebugButton('Reset Sal', 'reset', '#F44336'));
        
        // Add the panel to the page
        document.body.appendChild(debugPanel);
        console.log('DEBUG [INIT-2]: Added debug panel to page');
    }, 2000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SalAssistant };
} else if (typeof window !== 'undefined') {
    window.SalAssistant = SalAssistant;
}

// Add method to create test BBIDs with enhanced device information
SalAssistant.prototype.createTestBBID = async function(deviceName = 'Test User') {
    console.log('DEBUG [CREATE-TEST-1]: Creating test BBID for', deviceName);
    if (!this.bbidManager) {
        console.error('DEBUG [CREATE-TEST-ERROR]: BBID Manager not available');
        return false;
    }
    
    try {
        // Get enhanced device info
        const deviceInfo = await this._getDeviceInfo();
        console.log('DEBUG [CREATE-TEST-2]: Enhanced device info:', deviceInfo);
        
        // Generate a test BBID with the enhanced info
        const deviceType = deviceInfo.deviceType || 'desktop';
        const deviceOS = deviceInfo.os || navigator.platform;
        
        // Create a more detailed device object for the BBID
        const enhancedDeviceInfo = {
            type: deviceType,
            os: deviceInfo.os || 'unknown',
            osVersion: deviceInfo.osVersion || 'unknown',
            browser: deviceInfo.browser || 'unknown',
            browserVersion: deviceInfo.browserVersion || 'unknown',
            screen: deviceInfo.screen || { width: window.innerWidth, height: window.innerHeight },
            processor: deviceInfo.processor || 'unknown',
            location: deviceInfo.location || { city: 'Unknown', region: 'Unknown', country: 'Unknown' }
        };
        
        // Generate the BBID with enhanced info
        const bbid = await this.bbidManager.generateBBID(deviceName, deviceType, deviceOS, enhancedDeviceInfo);
        
        if (bbid) {
            console.log('DEBUG [CREATE-TEST-3]: Test BBID created successfully:', bbid);
            this.currentBBID = bbid;
            this.userIdentified = true;
            this.greetingDisplayed = false;
            
            // Trigger a greeting with the new BBID
            this._greetIdentifiedUser();
            return true;
        } else {
            console.error('DEBUG [CREATE-TEST-ERROR]: Failed to create test BBID');
            return false;
        }
    } catch (error) {
        console.error('DEBUG [CREATE-TEST-ERROR]:', error);
        return false;
    }
};

// Expose debug functions globally
window.debugSal = debugSal;
window.debugSalAdvanced = debugSalAdvanced;
