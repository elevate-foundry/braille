/**
 * Fingerprint Authenticator for SymbiOS
 * 
 * This module provides functionality to authenticate users via their phone's
 * fingerprint sensor over Bluetooth, similar to GitHub's authentication method.
 */

import BluetoothConnector from './bluetooth-connector.js';

class FingerprintAuthenticator {
  constructor() {
    this.bluetoothConnector = new BluetoothConnector();
    this.isAuthenticated = false;
    this.authenticationCallback = null;
    this.challengeToken = null;
  }
  
  /**
   * Initialize the authenticator
   * @returns {Promise} Promise that resolves when initialized
   */
  async initialize() {
    try {
      // Connect to the device via Bluetooth
      await this.bluetoothConnector.connect();
      console.log('Fingerprint authenticator initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize fingerprint authenticator:', error);
      throw error;
    }
  }
  
  /**
   * Generate a random challenge token
   * @returns {string} Random challenge token
   */
  generateChallengeToken() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Request fingerprint authentication
   * @param {Function} callback - Callback function to be called with authentication result
   * @returns {Promise} Promise that resolves with authentication result
   */
  async requestAuthentication(callback = null) {
    if (callback) {
      this.authenticationCallback = callback;
    }
    
    try {
      if (!this.bluetoothConnector.isConnected) {
        await this.bluetoothConnector.connect();
      }
      
      // Generate a challenge token
      this.challengeToken = this.generateChallengeToken();
      console.log('Generated challenge token:', this.challengeToken);
      
      // Show a notification on the phone to request fingerprint
      const result = await this.bluetoothConnector.requestAuthentication();
      
      this.isAuthenticated = result;
      
      if (this.authenticationCallback) {
        this.authenticationCallback(result);
      }
      
      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (this.authenticationCallback) {
        this.authenticationCallback(false, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
  
  /**
   * Sign a message with the authenticated session
   * @param {string} message - Message to sign
   * @returns {Promise} Promise that resolves with the signed message
   */
  async signMessage(message) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    // In a real implementation, this would use the phone to sign the message
    // For now, we'll just return a mock signature
    const signature = `${message}_signed_${Date.now()}`;
    return signature;
  }
  
  /**
   * Send a braille haptic message after authentication
   * @param {Array} pattern - Vibration pattern array
   * @returns {Promise} Promise that resolves when the pattern is sent
   */
  async sendAuthenticatedHapticPattern(pattern) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    return this.bluetoothConnector.sendHapticPattern(pattern);
  }
  
  /**
   * Send a braille haptic message after authentication
   * @param {string} message - Text message to convert to braille
   * @param {string} hapticMode - Haptic mode (standard, rhythmic, frequency)
   * @param {number} intensity - Vibration intensity (0.1 to 1.0)
   * @returns {Promise} Promise that resolves when the message is sent
   */
  async sendAuthenticatedHapticMessage(message, hapticMode = 'standard', intensity = 0.5) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Import BrailleHapticMessenger dynamically to avoid circular dependencies
      const BrailleHapticMessenger = (await import('./braille-haptic-messenger.js')).default;
      const messenger = new BrailleHapticMessenger();
      
      // Set haptic settings
      messenger.setSettings({
        hapticMode: hapticMode,
        intensity: intensity
      });
      
      // Convert text to braille patterns
      const braillePatterns = messenger.textToBraillePatterns(message);
      
      // Convert braille patterns to vibration pattern
      const vibrationPattern = messenger.braillePatternsToVibration(braillePatterns);
      
      // Send the pattern via Bluetooth
      return this.bluetoothConnector.sendHapticPattern(vibrationPattern);
    } catch (error) {
      console.error('Error sending authenticated haptic message:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the device
   */
  disconnect() {
    this.bluetoothConnector.disconnect();
    this.isAuthenticated = false;
  }
}

export default FingerprintAuthenticator;
