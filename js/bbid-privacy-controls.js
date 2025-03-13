/**
 * BBID Privacy Controls Module
 * Provides privacy-enhancing features for behavioral fingerprinting
 */

class BBIDPrivacyControls {
  /**
   * Initialize the privacy controls module
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      consentRequired: options.consentRequired !== false,
      privacyPolicyUrl: options.privacyPolicyUrl || '#privacy-policy',
      dataRetentionDays: options.dataRetentionDays || 90,
      allowDataDeletion: options.allowDataDeletion !== false,
      dataMinimization: options.dataMinimization !== false,
      anonymizationLevel: options.anonymizationLevel || 'standard', // 'minimal', 'standard', 'maximum'
      storageType: options.storageType || 'local', // 'local', 'session', 'none'
      debugMode: options.debugMode || false
    };
    
    // Initialize consent status
    this.consentStatus = this._getStoredConsent();
    
    // Initialize privacy settings
    this.privacySettings = this._getStoredPrivacySettings();
    
    // Initialize data access log
    this.dataAccessLog = [];
  }
  
  /**
   * Check if user has given consent for behavioral tracking
   * @returns {boolean} Consent status
   */
  hasConsent() {
    return this.consentStatus.consented;
  }
  
  /**
   * Request consent from the user
   * @param {Function} callback - Called when consent status changes
   */
  requestConsent(callback) {
    if (this.hasConsent()) {
      if (callback) callback(true);
      return;
    }
    
    // Create consent UI
    const consentContainer = document.createElement('div');
    consentContainer.className = 'bbid-consent-container';
    consentContainer.innerHTML = `
      <div class="bbid-consent-dialog">
        <h2>Privacy Notice</h2>
        <p>This site uses behavioral fingerprinting to enhance security and provide a better user experience.</p>
        <p>We collect the following types of data:</p>
        <ul>
          <li>Device characteristics (browser, OS, screen resolution)</li>
          <li>Interaction patterns (keyboard, mouse, touch gestures)</li>
          <li>Session information (time of day, usage frequency)</li>
        </ul>
        <p><strong>We do NOT collect:</strong></p>
        <ul>
          <li>Personal information (name, email, address)</li>
          <li>The content of what you type</li>
          <li>Your browsing history</li>
        </ul>
        <p>Your data remains on your device and is not shared with third parties.</p>
        <div class="bbid-consent-actions">
          <button class="bbid-consent-accept">Accept</button>
          <button class="bbid-consent-reject">Reject</button>
          <a href="${this.options.privacyPolicyUrl}" target="_blank">Privacy Policy</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(consentContainer);
    
    // Add event listeners
    const acceptButton = consentContainer.querySelector('.bbid-consent-accept');
    const rejectButton = consentContainer.querySelector('.bbid-consent-reject');
    
    acceptButton.addEventListener('click', () => {
      this._setConsent(true);
      document.body.removeChild(consentContainer);
      if (callback) callback(true);
    });
    
    rejectButton.addEventListener('click', () => {
      this._setConsent(false);
      document.body.removeChild(consentContainer);
      if (callback) callback(false);
    });
    
    // Add styles
    this._addConsentStyles();
  }
  
  /**
   * Apply privacy filters to behavioral data
   * @param {Object} behavioralData - Raw behavioral data
   * @returns {Object} Privacy-filtered behavioral data
   */
  applyPrivacyFilters(behavioralData) {
    if (!this.hasConsent()) {
      return this._getMinimalData(behavioralData);
    }
    
    // Clone the data to avoid modifying the original
    const filteredData = JSON.parse(JSON.stringify(behavioralData));
    
    // Apply data minimization if enabled
    if (this.options.dataMinimization) {
      this._minimizeData(filteredData);
    }
    
    // Apply anonymization based on level
    switch (this.options.anonymizationLevel) {
      case 'maximum':
        this._applyMaximumAnonymization(filteredData);
        break;
      case 'standard':
        this._applyStandardAnonymization(filteredData);
        break;
      case 'minimal':
        this._applyMinimalAnonymization(filteredData);
        break;
    }
    
    // Log data access
    this._logDataAccess('filtered', filteredData);
    
    return filteredData;
  }
  
  /**
   * Get user privacy settings UI
   * @param {Function} callback - Called when settings are updated
   * @returns {HTMLElement} Privacy settings UI element
   */
  getPrivacySettingsUI(callback) {
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'bbid-privacy-settings';
    
    settingsContainer.innerHTML = `
      <h3>Privacy Settings</h3>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="keyboard" ${this.privacySettings.keyboard ? 'checked' : ''}>
          Allow keyboard behavior tracking
        </label>
        <p class="bbid-setting-description">Tracks typing patterns, not the content of what you type</p>
      </div>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="mouse" ${this.privacySettings.mouse ? 'checked' : ''}>
          Allow mouse behavior tracking
        </label>
        <p class="bbid-setting-description">Tracks mouse movements and clicks</p>
      </div>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="touch" ${this.privacySettings.touch ? 'checked' : ''}>
          Allow touch behavior tracking
        </label>
        <p class="bbid-setting-description">Tracks touch gestures and patterns</p>
      </div>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="motion" ${this.privacySettings.motion ? 'checked' : ''}>
          Allow motion sensor tracking
        </label>
        <p class="bbid-setting-description">Tracks device orientation and movement</p>
      </div>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="session" ${this.privacySettings.session ? 'checked' : ''}>
          Allow session tracking
        </label>
        <p class="bbid-setting-description">Tracks usage patterns and time</p>
      </div>
      <div class="bbid-setting-group">
        <label>
          <input type="checkbox" name="ui" ${this.privacySettings.ui ? 'checked' : ''}>
          Allow UI interaction tracking
        </label>
        <p class="bbid-setting-description">Tracks how you interact with page elements</p>
      </div>
      <div class="bbid-setting-actions">
        <button class="bbid-settings-save">Save Settings</button>
        <button class="bbid-data-delete">Delete My Data</button>
      </div>
    `;
    
    // Add event listeners
    const saveButton = settingsContainer.querySelector('.bbid-settings-save');
    const deleteButton = settingsContainer.querySelector('.bbid-data-delete');
    
    saveButton.addEventListener('click', () => {
      const inputs = settingsContainer.querySelectorAll('input[type="checkbox"]');
      inputs.forEach(input => {
        this.privacySettings[input.name] = input.checked;
      });
      
      this._storePrivacySettings();
      if (callback) callback(this.privacySettings);
    });
    
    deleteButton.addEventListener('click', () => {
      if (this.options.allowDataDeletion) {
        this._deleteUserData();
        if (callback) callback({ dataDeleted: true });
      }
    });
    
    // Add styles
    this._addSettingsStyles();
    
    return settingsContainer;
  }
  
  /**
   * Get privacy explanation for users
   * @returns {HTMLElement} Privacy explanation UI element
   */
  getPrivacyExplanation() {
    const explanationContainer = document.createElement('div');
    explanationContainer.className = 'bbid-privacy-explanation';
    
    explanationContainer.innerHTML = `
      <h3>How We Use Behavioral Fingerprinting</h3>
      <p>Behavioral fingerprinting helps us recognize your device without requiring passwords or personal information.</p>
      
      <div class="bbid-explanation-section">
        <h4>What We Collect</h4>
        <ul>
          <li><strong>Device Information:</strong> Browser type, operating system, screen resolution</li>
          <li><strong>Interaction Patterns:</strong> How you type, move your mouse, or use touch gestures</li>
          <li><strong>Session Information:</strong> When you typically use our service</li>
        </ul>
      </div>
      
      <div class="bbid-explanation-section">
        <h4>What We DON'T Collect</h4>
        <ul>
          <li><strong>Personal Information:</strong> We never collect names, emails, addresses, or any personally identifiable information</li>
          <li><strong>Content:</strong> We don't record what you type, only how you type it</li>
          <li><strong>Browsing History:</strong> We don't track which websites you visit</li>
        </ul>
      </div>
      
      <div class="bbid-explanation-section">
        <h4>How It Enhances Security</h4>
        <p>Even if someone steals your password, they can't mimic your unique behavioral patterns, adding an extra layer of security.</p>
      </div>
      
      <div class="bbid-explanation-section">
        <h4>Your Control</h4>
        <p>You can adjust privacy settings or delete your behavioral data at any time using the Privacy Settings panel.</p>
      </div>
    `;
    
    // Add styles
    this._addExplanationStyles();
    
    return explanationContainer;
  }
  
  /**
   * Delete user's behavioral data
   * @private
   */
  _deleteUserData() {
    // Clear local storage data
    localStorage.removeItem('bbid_consent');
    localStorage.removeItem('bbid_privacy_settings');
    localStorage.removeItem('bbid_session_count');
    localStorage.removeItem('bbid_last_session');
    
    // Clear any other stored fingerprinting data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('bbid_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset consent and settings
    this.consentStatus = { consented: false, timestamp: Date.now() };
    this.privacySettings = this._getDefaultPrivacySettings();
    
    // Log the deletion
    this._logDataAccess('deleted', null);
    
    // Show confirmation
    alert('Your behavioral data has been deleted.');
  }
  
  /**
   * Get stored consent status
   * @private
   * @returns {Object} Consent status object
   */
  _getStoredConsent() {
    const storedConsent = localStorage.getItem('bbid_consent');
    if (storedConsent) {
      try {
        return JSON.parse(storedConsent);
      } catch (e) {
        // Invalid JSON, reset consent
      }
    }
    
    return { consented: false, timestamp: null };
  }
  
  /**
   * Set consent status
   * @private
   * @param {boolean} consented - Whether user has consented
   */
  _setConsent(consented) {
    this.consentStatus = {
      consented: consented,
      timestamp: Date.now()
    };
    
    localStorage.setItem('bbid_consent', JSON.stringify(this.consentStatus));
  }
  
  /**
   * Get stored privacy settings
   * @private
   * @returns {Object} Privacy settings object
   */
  _getStoredPrivacySettings() {
    const storedSettings = localStorage.getItem('bbid_privacy_settings');
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings);
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }
    
    return this._getDefaultPrivacySettings();
  }
  
  /**
   * Get default privacy settings
   * @private
   * @returns {Object} Default privacy settings
   */
  _getDefaultPrivacySettings() {
    return {
      keyboard: true,
      mouse: true,
      touch: true,
      motion: true,
      session: true,
      ui: true
    };
  }
  
  /**
   * Store privacy settings
   * @private
   */
  _storePrivacySettings() {
    localStorage.setItem('bbid_privacy_settings', JSON.stringify(this.privacySettings));
  }
  
  /**
   * Get minimal data when consent is not given
   * @private
   * @param {Object} behavioralData - Original behavioral data
   * @returns {Object} Minimal data object
   */
  _getMinimalData(behavioralData) {
    // Return only basic device information, no behavioral patterns
    return {
      deviceId: behavioralData.deviceId,
      sessionMetrics: {
        screenSize: behavioralData.sessionMetrics?.screenSize,
        colorDepth: behavioralData.sessionMetrics?.colorDepth,
        timezone: behavioralData.sessionMetrics?.timezone,
        language: behavioralData.sessionMetrics?.language
      }
    };
  }
  
  /**
   * Apply data minimization
   * @private
   * @param {Object} data - Behavioral data to minimize
   */
  _minimizeData(data) {
    // Remove raw data arrays, keeping only the derived metrics
    if (data.keyboardMetrics) {
      delete data.keyboardMetrics.keyPressTimestamps;
      delete data.keyboardMetrics.keyReleaseTimestamps;
      delete data.keyboardMetrics.keyPressIntervals;
      delete data.keyboardMetrics.keyHoldDurations;
      delete data.keyboardMetrics.rhythmPatterns;
    }
    
    if (data.mouseMetrics) {
      delete data.mouseMetrics.positions;
      delete data.mouseMetrics.trajectories;
      delete data.mouseMetrics.speeds;
      delete data.mouseMetrics.accelerations;
      delete data.mouseMetrics.clickPositions;
    }
    
    if (data.touchMetrics) {
      delete data.touchMetrics.touchPositions;
      delete data.touchMetrics.pressures;
      delete data.touchMetrics.swipeDirections;
      delete data.touchMetrics.swipeSpeeds;
      delete data.touchMetrics.swipeLengths;
    }
    
    if (data.motionMetrics) {
      delete data.motionMetrics.orientationSamples;
      delete data.motionMetrics.accelerationSamples;
      delete data.motionMetrics.rotationSamples;
      delete data.motionMetrics.tiltAngles;
    }
    
    if (data.scrollPatterns) {
      delete data.scrollPatterns.scrollPositions;
      delete data.scrollPatterns.scrollSpeeds;
      delete data.scrollPatterns.scrollAccelerations;
    }
    
    if (data.interactionFlow) {
      data.interactionFlow = [];
    }
  }
  
  /**
   * Apply minimal anonymization
   * @private
   * @param {Object} data - Behavioral data to anonymize
   */
  _applyMinimalAnonymization(data) {
    // Apply user privacy settings
    if (!this.privacySettings.keyboard && data.keyboardMetrics) {
      data.keyboardMetrics = { keyPressCount: 0 };
    }
    
    if (!this.privacySettings.mouse && data.mouseMetrics) {
      data.mouseMetrics = { moveCount: 0, clickCount: 0 };
    }
    
    if (!this.privacySettings.touch && data.touchMetrics) {
      data.touchMetrics = { touchCount: 0 };
    }
    
    if (!this.privacySettings.motion && data.motionMetrics) {
      data.motionMetrics = { stability: 0 };
    }
    
    if (!this.privacySettings.session && data.sessionMetrics) {
      // Keep only basic device info
      const { screenSize, colorDepth, timezone, language } = data.sessionMetrics;
      data.sessionMetrics = { screenSize, colorDepth, timezone, language };
    }
    
    if (!this.privacySettings.ui && data.uiInteractions) {
      data.uiInteractions = { interactionCount: 0 };
    }
  }
  
  /**
   * Apply standard anonymization
   * @private
   * @param {Object} data - Behavioral data to anonymize
   */
  _applyStandardAnonymization(data) {
    // First apply minimal anonymization
    this._applyMinimalAnonymization(data);
    
    // Then add standard anonymization techniques
    
    // Round timing values to reduce precision
    if (data.keyboardMetrics) {
      if (data.keyboardMetrics.averageTypingSpeed) {
        data.keyboardMetrics.averageTypingSpeed = Math.round(data.keyboardMetrics.averageTypingSpeed / 5) * 5;
      }
    }
    
    if (data.mouseMetrics) {
      if (data.mouseMetrics.averageSpeed) {
        data.mouseMetrics.averageSpeed = Math.round(data.mouseMetrics.averageSpeed / 10) * 10;
      }
    }
    
    // Remove specific key information
    if (data.keyboardMetrics && data.keyboardMetrics.keyCodes) {
      // Replace with frequency categories instead of specific keys
      const categories = {
        letters: 0,
        numbers: 0,
        special: 0,
        navigation: 0
      };
      
      Object.keys(data.keyboardMetrics.keyCodes).forEach(key => {
        const code = parseInt(key, 10);
        if (code >= 65 && code <= 90) categories.letters += data.keyboardMetrics.keyCodes[key];
        else if (code >= 48 && code <= 57) categories.numbers += data.keyboardMetrics.keyCodes[key];
        else if (code >= 37 && code <= 40) categories.navigation += data.keyboardMetrics.keyCodes[key];
        else categories.special += data.keyboardMetrics.keyCodes[key];
      });
      
      data.keyboardMetrics.keyCategories = categories;
      delete data.keyboardMetrics.keyCodes;
    }
  }
  
  /**
   * Apply maximum anonymization
   * @private
   * @param {Object} data - Behavioral data to anonymize
   */
  _applyMaximumAnonymization(data) {
    // First apply standard anonymization
    this._applyStandardAnonymization(data);
    
    // Then add maximum anonymization techniques
    
    // Convert all metrics to relative scores rather than absolute values
    if (data.keyboardMetrics) {
      const typingSpeed = data.keyboardMetrics.averageTypingSpeed;
      if (typingSpeed) {
        // Convert to a relative score (1-5)
        if (typingSpeed < 30) data.keyboardMetrics.typingSpeedCategory = 1;
        else if (typingSpeed < 60) data.keyboardMetrics.typingSpeedCategory = 2;
        else if (typingSpeed < 90) data.keyboardMetrics.typingSpeedCategory = 3;
        else if (typingSpeed < 120) data.keyboardMetrics.typingSpeedCategory = 4;
        else data.keyboardMetrics.typingSpeedCategory = 5;
        
        delete data.keyboardMetrics.averageTypingSpeed;
      }
    }
    
    if (data.mouseMetrics) {
      const moveSpeed = data.mouseMetrics.averageSpeed;
      if (moveSpeed) {
        // Convert to a relative score (1-5)
        if (moveSpeed < 100) data.mouseMetrics.moveSpeedCategory = 1;
        else if (moveSpeed < 300) data.mouseMetrics.moveSpeedCategory = 2;
        else if (moveSpeed < 500) data.mouseMetrics.moveSpeedCategory = 3;
        else if (moveSpeed < 700) data.mouseMetrics.moveSpeedCategory = 4;
        else data.mouseMetrics.moveSpeedCategory = 5;
        
        delete data.mouseMetrics.averageSpeed;
      }
    }
    
    // Remove all timestamps
    if (data.sessionMetrics) {
      delete data.sessionMetrics.sessionStartTime;
      delete data.sessionMetrics.timeOfDay;
      
      // Replace with category
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) data.sessionMetrics.timeCategory = 'morning';
      else if (hour >= 12 && hour < 17) data.sessionMetrics.timeCategory = 'afternoon';
      else if (hour >= 17 && hour < 21) data.sessionMetrics.timeCategory = 'evening';
      else data.sessionMetrics.timeCategory = 'night';
    }
  }
  
  /**
   * Log data access for auditing
   * @private
   * @param {string} action - Action performed
   * @param {Object} data - Data accessed
   */
  _logDataAccess(action, data) {
    const logEntry = {
      timestamp: Date.now(),
      action: action,
      dataTypes: data ? Object.keys(data) : []
    };
    
    this.dataAccessLog.push(logEntry);
    
    // Keep log size reasonable
    if (this.dataAccessLog.length > 100) {
      this.dataAccessLog.shift();
    }
    
    // Debug output if enabled
    if (this.options.debugMode) {
      console.log('BBID Privacy: Data access logged', logEntry);
    }
  }
  
  /**
   * Add consent dialog styles
   * @private
   */
  _addConsentStyles() {
    if (document.getElementById('bbid-consent-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'bbid-consent-styles';
    styleEl.textContent = `
      .bbid-consent-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      .bbid-consent-dialog {
        background-color: #fff;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
      }
      
      .bbid-consent-dialog h2 {
        margin-top: 0;
        color: #333;
      }
      
      .bbid-consent-dialog p {
        line-height: 1.5;
        color: #555;
      }
      
      .bbid-consent-dialog ul {
        padding-left: 20px;
        margin-bottom: 20px;
      }
      
      .bbid-consent-dialog li {
        margin-bottom: 8px;
        color: #555;
      }
      
      .bbid-consent-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
      }
      
      .bbid-consent-actions button {
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-size: 14px;
      }
      
      .bbid-consent-accept {
        background-color: #3498db;
        color: white;
      }
      
      .bbid-consent-reject {
        background-color: #f1f1f1;
        color: #333;
      }
      
      .bbid-consent-actions a {
        color: #3498db;
        text-decoration: none;
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  /**
   * Add settings panel styles
   * @private
   */
  _addSettingsStyles() {
    if (document.getElementById('bbid-settings-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'bbid-settings-styles';
    styleEl.textContent = `
      .bbid-privacy-settings {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 500px;
        border: 1px solid #ddd;
      }
      
      .bbid-privacy-settings h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .bbid-setting-group {
        margin-bottom: 16px;
      }
      
      .bbid-setting-group label {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      
      .bbid-setting-group input[type="checkbox"] {
        margin-right: 10px;
      }
      
      .bbid-setting-description {
        margin: 0 0 0 24px;
        font-size: 13px;
        color: #666;
      }
      
      .bbid-setting-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #eee;
      }
      
      .bbid-setting-actions button {
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-size: 14px;
      }
      
      .bbid-settings-save {
        background-color: #3498db;
        color: white;
      }
      
      .bbid-data-delete {
        background-color: #e74c3c;
        color: white;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  /**
   * Add explanation styles
   * @private
   */
  _addExplanationStyles() {
    if (document.getElementById('bbid-explanation-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'bbid-explanation-styles';
    styleEl.textContent = `
      .bbid-privacy-explanation {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 600px;
        border: 1px solid #ddd;
      }
      
      .bbid-privacy-explanation h3 {
        margin-top: 0;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      .bbid-explanation-section {
        margin-bottom: 20px;
      }
      
      .bbid-explanation-section h4 {
        color: #3498db;
        margin-bottom: 8px;
      }
      
      .bbid-explanation-section p {
        line-height: 1.5;
        color: #555;
        margin: 0 0 10px;
      }
      
      .bbid-explanation-section ul {
        padding-left: 20px;
        margin-bottom: 10px;
      }
      
      .bbid-explanation-section li {
        margin-bottom: 6px;
        color: #555;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
}

// Export for browser and Node.js environments
if (typeof window !== 'undefined') {
  window.BBIDPrivacyControls = BBIDPrivacyControls;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = BBIDPrivacyControls;
}
