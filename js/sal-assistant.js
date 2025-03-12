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
            // Wait for voices to be loaded
            if (this.speechSynthesis.getVoices().length === 0) {
                await new Promise(resolve => {
                    this.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
                    // Fallback if event doesn't fire
                    setTimeout(resolve, 1000);
                });
            }
            
            // Get available voices
            this.availableVoices = this.speechSynthesis.getVoices();
            
            // Select a default voice based on language
            this._selectVoice(this.options.language);
            
            // Create BrailleFST instance if not provided
            if (!this.brailleFST) {
                // Check if BrailleFST is available
                if (typeof BrailleFST !== 'undefined') {
                    this.brailleFST = new BrailleFST({
                        grade: 2,
                        language: this.options.language.split('-')[0]
                    });
                } else {
                    console.warn('BrailleFST not available. Sal will operate with limited functionality.');
                }
            }
            
            // Create UI elements
            this._createUI();
            
            // Set initialized flag
            this.initialized = true;
            
            // Auto-greet if enabled
            if (this.options.autoGreet) {
                // Slight delay to ensure page has loaded
                setTimeout(() => this.greet(), 1500);
            }
            
            console.log('Sal Assistant initialized successfully!');
        } catch (error) {
            console.error('Error initializing Sal Assistant:', error);
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
        `;
        
        // Append elements to container
        salContainer.appendChild(salAvatar);
        salContainer.appendChild(salSpeech);
        salContainer.appendChild(salControls);
        
        // Append container to body
        document.body.appendChild(salContainer);
        
        // Add event listeners
        document.getElementById('sal-speak').addEventListener('click', () => this.speak());
        document.getElementById('sal-mute').addEventListener('click', () => this.toggleMute());
        
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
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Greet the user
     */
    greet() {
        if (!this.initialized || this.greetingDisplayed) return;
        
        // Get language code
        const langCode = this.options.language.split('-')[0];
        
        // Get greetings for the current language or fall back to English
        const greetingsForLang = this.greetings[langCode] || this.greetings['en'];
        
        // Select a random greeting
        const greeting = greetingsForLang[Math.floor(Math.random() * greetingsForLang.length)];
        
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
        if (!this.initialized || !this.speechSynthesis) return;
        
        // Stop any current speech
        this.stop();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set utterance properties
        utterance.voice = this.options.voice;
        utterance.rate = this.options.rate;
        utterance.pitch = this.options.pitch;
        utterance.volume = this.options.volume;
        
        // Set language
        utterance.lang = this.options.language;
        
        // Add event listeners
        utterance.onstart = () => {
            this.speaking = true;
            this._updateUI(text, true);
        };
        
        utterance.onend = () => {
            this.speaking = false;
            setTimeout(() => {
                this._updateUI('', false);
            }, 2000);
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.speaking = false;
            this._updateUI('', false);
        };
        
        // Speak the utterance
        this.speechSynthesis.speak(utterance);
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
     * Update the UI based on speaking state
     * @param {string} text - Text being spoken
     * @param {boolean} speaking - Whether Sal is speaking
     * @private
     */
    _updateUI(text, speaking) {
        // Update avatar
        const salAvatar = document.querySelector('.sal-avatar');
        if (salAvatar) {
            if (speaking) {
                salAvatar.classList.add('sal-speaking');
            } else {
                salAvatar.classList.remove('sal-speaking');
            }
        }
        
        // Update speech bubble
        const salSpeech = document.querySelector('.sal-speech');
        const salMessage = document.getElementById('sal-message');
        
        if (salSpeech && salMessage) {
            if (text) {
                salMessage.textContent = text;
                salSpeech.classList.add('active');
            } else {
                setTimeout(() => {
                    salSpeech.classList.remove('active');
                }, 500);
            }
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
}

// Create and export Sal instance
let salAssistant;

document.addEventListener('DOMContentLoaded', function() {
    // Create Sal instance
    salAssistant = new SalAssistant();
    
    // Make Sal globally accessible
    window.salAssistant = salAssistant;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SalAssistant };
} else if (typeof window !== 'undefined') {
    window.SalAssistant = SalAssistant;
}
