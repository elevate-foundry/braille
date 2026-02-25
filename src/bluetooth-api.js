/**
 * BrailleBuddy Bluetooth API Integration
 * 
 * This module provides Bluetooth connectivity for braille hardware devices,
 * integrating with the haptic feedback system and supporting the mobile-first design.
 */

class BrailleBuddyBluetoothAPI {
  constructor() {
    this.device = null;
    this.server = null;
    this.brailleService = null;
    this.brailleCharacteristic = null;
    this.hapticCharacteristic = null;
    this.isConnected = false;
    this.listeners = {
      onConnected: [],
      onDisconnected: [],
      onDataReceived: [],
      onError: []
    };
    
    // Bluetooth service and characteristic UUIDs
    this.SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // Custom service UUID
    this.BRAILLE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write characteristic
    this.HAPTIC_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notification characteristic
    
    // Haptic feedback configuration
    this.hapticConfig = {
      mode: 'standard', // 'standard', 'rhythmic', 'frequency'
      intensity: 0.7,   // 0.0 to 1.0
      duration: 50,     // milliseconds
      patterns: {
        // Braille character to vibration pattern mapping
        'a': [100],
        'b': [100, 50, 100],
        'c': [100, 50, 100, 50, 100],
        // Add patterns for all braille characters
      }
    };
  }

  /**
   * Initialize the Bluetooth API
   * @returns {Promise<boolean>} - True if Web Bluetooth API is available
   */
  async initialize() {
    if (!navigator.bluetooth) {
      console.error('Web Bluetooth API is not available in this browser/device');
      return false;
    }
    
    // Check if we're running on a mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initialize haptic feedback if available
    if (this.isMobile && 'vibrate' in navigator) {
      this.hapticFeedbackAvailable = true;
    } else {
      this.hapticFeedbackAvailable = false;
      console.warn('Haptic feedback not available on this device');
    }
    
    return true;
  }

  /**
   * Request connection to a Braille device
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      console.log('Requesting Bluetooth device...');
      
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] },
          { namePrefix: 'BrailleBuddy' }
        ],
        optionalServices: [this.SERVICE_UUID]
      });
      
      if (!this.device) {
        throw new Error('No device selected');
      }
      
      console.log('Device selected:', this.device.name);
      
      // Add event listener for disconnection
      this.device.addEventListener('gattserverdisconnected', this._onDisconnected.bind(this));
      
      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.server = await this.device.gatt.connect();
      
      // Get the Braille service
      console.log('Getting Braille service...');
      this.brailleService = await this.server.getPrimaryService(this.SERVICE_UUID);
      
      // Get the Braille characteristics
      console.log('Getting Braille characteristics...');
      this.brailleCharacteristic = await this.brailleService.getCharacteristic(this.BRAILLE_CHAR_UUID);
      this.hapticCharacteristic = await this.brailleService.getCharacteristic(this.HAPTIC_CHAR_UUID);
      
      // Start notifications for haptic feedback
      await this.hapticCharacteristic.startNotifications();
      this.hapticCharacteristic.addEventListener('characteristicvaluechanged', this._onDataReceived.bind(this));
      
      this.isConnected = true;
      this._notifyListeners('onConnected', { device: this.device });
      
      console.log('Bluetooth connection established successfully');
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this._notifyListeners('onError', { error });
      return false;
    }
  }

  /**
   * Disconnect from the Braille device
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.device || !this.isConnected) {
      return;
    }
    
    try {
      // Stop notifications
      if (this.hapticCharacteristic) {
        await this.hapticCharacteristic.stopNotifications();
      }
      
      // Disconnect
      if (this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
      
      this.isConnected = false;
      console.log('Bluetooth device disconnected');
    } catch (error) {
      console.error('Error during disconnection:', error);
      this._notifyListeners('onError', { error });
    }
  }

  /**
   * Send Braille data to the connected device
   * @param {string|Array} brailleData - Braille character or dot pattern
   * @returns {Promise<boolean>} - Success status
   */
  async sendBrailleData(brailleData) {
    if (!this.isConnected || !this.brailleCharacteristic) {
      console.error('Not connected to a Braille device');
      return false;
    }
    
    try {
      let data;
      
      // Convert string to byte array if needed
      if (typeof brailleData === 'string') {
        data = this._convertBrailleStringToByteArray(brailleData);
      } else if (Array.isArray(brailleData)) {
        data = new Uint8Array(brailleData);
      } else {
        throw new Error('Invalid braille data format');
      }
      
      // Send data to device
      await this.brailleCharacteristic.writeValue(data);
      
      // Trigger haptic feedback if available
      if (this.hapticFeedbackAvailable && typeof brailleData === 'string') {
        this._triggerHapticFeedback(brailleData);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending Braille data:', error);
      this._notifyListeners('onError', { error });
      return false;
    }
  }

  /**
   * Register event listeners
   * @param {string} event - Event name: 'onConnected', 'onDisconnected', 'onDataReceived', 'onError'
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Configure haptic feedback settings
   * @param {Object} config - Haptic feedback configuration
   */
  configureHapticFeedback(config) {
    this.hapticConfig = { ...this.hapticConfig, ...config };
  }

  /**
   * Check if a specific Braille device is available
   * @param {string} deviceNamePrefix - Device name prefix to search for
   * @returns {Promise<boolean>} - True if device is available
   */
  async isDeviceAvailable(deviceNamePrefix = 'BrailleBuddy') {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: deviceNamePrefix }],
        acceptAllDevices: false
      });
      
      return !!device;
    } catch (error) {
      console.error('Error checking device availability:', error);
      return false;
    }
  }

  /**
   * Get available Braille devices
   * @returns {Promise<Array>} - List of available devices
   */
  async getAvailableDevices() {
    // Note: Web Bluetooth API doesn't support scanning for devices without user interaction
    // This is a placeholder for future native implementations
    console.warn('Web Bluetooth API does not support scanning for devices without user interaction');
    return [];
  }

  // ===== PRIVATE METHODS =====

  /**
   * Handle disconnection event
   * @private
   */
  _onDisconnected(event) {
    this.isConnected = false;
    this._notifyListeners('onDisconnected', { device: this.device });
    console.log('Bluetooth device disconnected');
  }

  /**
   * Handle data received from device
   * @private
   */
  _onDataReceived(event) {
    const value = event.target.value;
    const data = new Uint8Array(value.buffer);
    this._notifyListeners('onDataReceived', { data });
  }

  /**
   * Notify all listeners for a specific event
   * @private
   */
  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Convert Braille string to byte array
   * @private
   */
  _convertBrailleStringToByteArray(brailleString) {
    // Implementation depends on your Braille encoding
    const byteArray = new Uint8Array(brailleString.length);
    
    for (let i = 0; i < brailleString.length; i++) {
      // Example conversion (would need to be adapted to your specific encoding)
      byteArray[i] = brailleString.charCodeAt(i);
    }
    
    return byteArray;
  }

  /**
   * Trigger haptic feedback for a Braille character
   * @private
   */
  _triggerHapticFeedback(brailleChar) {
    if (!this.hapticFeedbackAvailable) return;
    
    let pattern;
    
    switch (this.hapticConfig.mode) {
      case 'standard':
        // Use predefined pattern for the character if available
        pattern = this.hapticConfig.patterns[brailleChar] || [this.hapticConfig.duration];
        break;
        
      case 'rhythmic':
        // Create rhythmic pattern based on the Braille dot pattern
        const dotPattern = this._getBrailleDotPattern(brailleChar);
        pattern = [];
        
        dotPattern.forEach((dot, index) => {
          if (dot) {
            pattern.push(this.hapticConfig.duration);
            if (index < dotPattern.length - 1) pattern.push(20); // Short pause between dots
          }
        });
        
        if (pattern.length === 0) pattern = [this.hapticConfig.duration];
        break;
        
      case 'frequency':
        // For frequency-based feedback (simple implementation)
        const dotCount = this._getBrailleDotPattern(brailleChar).filter(dot => dot).length;
        const intensity = Math.max(30, Math.min(100, dotCount * 20)); // Scale intensity based on dot count
        pattern = [intensity];
        break;
        
      default:
        pattern = [this.hapticConfig.duration];
    }
    
    // Apply intensity scaling
    pattern = pattern.map(p => Math.round(p * this.hapticConfig.intensity));
    
    // Trigger vibration
    navigator.vibrate(pattern);
  }

  /**
   * Get the dot pattern for a Braille character
   * @private
   */
  _getBrailleDotPattern(brailleChar) {
    // This is a simplified example - would need to be expanded with actual Braille patterns
    const patterns = {
      'a': [1, 0, 0, 0, 0, 0], // ⠁
      'b': [1, 1, 0, 0, 0, 0], // ⠃
      'c': [1, 0, 0, 1, 0, 0], // ⠉
      // Add patterns for all characters
    };
    
    return patterns[brailleChar] || [0, 0, 0, 0, 0, 0];
  }
}

// Export the API
export default BrailleBuddyBluetoothAPI;
