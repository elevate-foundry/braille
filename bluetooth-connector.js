/**
 * Bluetooth Connector for SymbiOS
 * 
 * This module provides functionality to connect to phones via Bluetooth
 * and send haptic feedback commands directly.
 */

class BluetoothConnector {
  constructor() {
    this.device = null;
    this.gattServer = null;
    this.hapticService = null;
    this.hapticCharacteristic = null;
    
    // Standard service/characteristic UUIDs for vibration control
    // Note: These are example UUIDs and may need to be adjusted based on the phone's Bluetooth implementation
    this.HAPTIC_SERVICE_UUID = '00001802-0000-1000-8000-00805f9b34fb';
    this.HAPTIC_CHARACTERISTIC_UUID = '00002a06-0000-1000-8000-00805f9b34fb';
    
    // Authentication service/characteristic UUIDs
    this.AUTH_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
    this.AUTH_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
    
    this.isConnected = false;
  }
  
  /**
   * Request Bluetooth device and connect to it
   * @returns {Promise} Promise that resolves when connected
   */
  async connect() {
    try {
      console.log('Requesting Bluetooth device...');
      
      // Request device with specific services
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.HAPTIC_SERVICE_UUID] },
          { namePrefix: 'Galaxy' },
          { namePrefix: 'Samsung' },
          { namePrefix: 'iPhone' },
          { namePrefix: 'Pixel' }
        ],
        optionalServices: [this.HAPTIC_SERVICE_UUID, this.AUTH_SERVICE_UUID]
      });
      
      console.log('Device selected:', this.device.name);
      
      // Add event listener for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
      
      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.gattServer = await this.device.gatt.connect();
      
      // Get haptic service
      console.log('Getting haptic service...');
      this.hapticService = await this.gattServer.getPrimaryService(this.HAPTIC_SERVICE_UUID);
      
      // Get haptic characteristic
      console.log('Getting haptic characteristic...');
      this.hapticCharacteristic = await this.hapticService.getCharacteristic(this.HAPTIC_CHARACTERISTIC_UUID);
      
      this.isConnected = true;
      console.log('Bluetooth connection established successfully!');
      
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * Handle device disconnection
   */
  onDisconnected() {
    console.log('Device disconnected:', this.device.name);
    this.isConnected = false;
    
    // Attempt to reconnect
    this.reconnect();
  }
  
  /**
   * Attempt to reconnect to the device
   */
  async reconnect() {
    try {
      console.log('Attempting to reconnect...');
      if (!this.device) {
        console.error('No device to reconnect to');
        return false;
      }
      
      this.gattServer = await this.device.gatt.connect();
      this.hapticService = await this.gattServer.getPrimaryService(this.HAPTIC_SERVICE_UUID);
      this.hapticCharacteristic = await this.hapticService.getCharacteristic(this.HAPTIC_CHARACTERISTIC_UUID);
      
      this.isConnected = true;
      console.log('Reconnected successfully!');
      return true;
    } catch (error) {
      console.error('Reconnection failed:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the device
   */
  disconnect() {
    if (this.gattServer && this.isConnected) {
      this.gattServer.disconnect();
      this.isConnected = false;
      console.log('Disconnected from device');
    }
  }
  
  /**
   * Send haptic pattern to the device
   * @param {Array} pattern - Vibration pattern array (alternating durations: vibrate, pause, vibrate, ...)
   * @returns {Promise} Promise that resolves when the pattern is sent
   */
  async sendHapticPattern(pattern) {
    if (!this.isConnected || !this.hapticCharacteristic) {
      throw new Error('Not connected to a Bluetooth device');
    }
    
    try {
      // Convert pattern to bytes
      const patternBytes = new Uint8Array(pattern);
      
      // Write pattern to characteristic
      await this.hapticCharacteristic.writeValue(patternBytes);
      console.log('Haptic pattern sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending haptic pattern:', error);
      throw error;
    }
  }
  
  /**
   * Request fingerprint authentication from the device using a GitHub-like challenge-response mechanism
   * @param {string} challengeToken - Optional challenge token for verification
   * @returns {Promise} Promise that resolves with authentication result
   */
  async requestAuthentication(challengeToken = null) {
    if (!this.isConnected) {
      throw new Error('Not connected to a Bluetooth device');
    }
    
    try {
      // Get authentication service
      const authService = await this.gattServer.getPrimaryService(this.AUTH_SERVICE_UUID);
      
      // Get authentication characteristic
      const authCharacteristic = await authService.getCharacteristic(this.AUTH_CHARACTERISTIC_UUID);
      
      // Generate a challenge token if not provided
      if (!challengeToken) {
        challengeToken = this.generateChallengeToken();
      }
      console.log('Using challenge token:', challengeToken);
      
      // Convert challenge token to bytes
      const encoder = new TextEncoder();
      const challengeBytes = encoder.encode(challengeToken);
      
      // Write authentication request with challenge token
      await authCharacteristic.writeValue(challengeBytes);
      
      // Wait for response via notifications
      return new Promise((resolve, reject) => {
        let responseBuffer = '';
        
        const handleNotification = (event) => {
          const value = event.target.value;
          const decoder = new TextDecoder();
          const chunk = decoder.decode(value);
          
          // Accumulate response chunks
          responseBuffer += chunk;
          
          // Check if we have a complete response
          if (responseBuffer.includes('AUTH:')) {
            const parts = responseBuffer.split('AUTH:');
            if (parts.length > 1) {
              const response = parts[1].trim();
              
              // Verify the response (in a real implementation, this would be a cryptographic verification)
              const expectedResponse = this.generateExpectedResponse(challengeToken);
              const isAuthenticated = (response === expectedResponse);
              
              console.log('Authentication ' + (isAuthenticated ? 'successful' : 'failed'));
              authCharacteristic.removeEventListener('characteristicvaluechanged', handleNotification);
              authCharacteristic.stopNotifications();
              
              resolve(isAuthenticated);
            }
          }
        };
        
        authCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
        authCharacteristic.startNotifications();
        
        // Timeout after 30 seconds
        setTimeout(() => {
          authCharacteristic.removeEventListener('characteristicvaluechanged', handleNotification);
          authCharacteristic.stopNotifications();
          reject(new Error('Authentication timed out'));
        }, 30000);
      });
    } catch (error) {
      console.error('Error requesting authentication:', error);
      throw error;
    }
  }
  
  /**
   * Generate a random challenge token
   * @returns {string} Random challenge token
   */
  generateChallengeToken() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Generate the expected response for a challenge token
   * In a real implementation, this would be a cryptographic function
   * @param {string} challengeToken - Challenge token
   * @returns {string} Expected response
   */
  generateExpectedResponse(challengeToken) {
    // This is a simplified example - in a real implementation,
    // this would use a proper cryptographic function
    return challengeToken.split('').reverse().join('') + '_verified';
  }
}

export default BluetoothConnector;
