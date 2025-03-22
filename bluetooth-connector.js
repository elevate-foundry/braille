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
   * @param {boolean} useAllDevices - If true, show all available Bluetooth devices
   * @returns {Promise} Promise that resolves when connected
   */
  async connect(useAllDevices = false) {
    try {
      console.log('Requesting Bluetooth device...');
      
      let requestOptions;
      
      if (useAllDevices) {
        // Show all available Bluetooth devices
        console.log('Showing all available Bluetooth devices');
        requestOptions = {
          acceptAllDevices: true,
          optionalServices: [
            this.HAPTIC_SERVICE_UUID, 
            this.AUTH_SERVICE_UUID,
            // Common Bluetooth services for broader compatibility
            '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
            '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
            '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
            '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
            '00001812-0000-1000-8000-00805f9b34fb'  // Human Interface Device
          ]
        };
      } else {
        // Use filters for specific devices
        requestOptions = {
          filters: [
            { namePrefix: 'Galaxy' },
            { namePrefix: 'Samsung' },
            { namePrefix: 'iPhone' },
            { namePrefix: 'Pixel' },
            { namePrefix: 'Android' },
            // Add more common device name prefixes
            { namePrefix: 'MI' },      // Xiaomi
            { namePrefix: 'HUAWEI' },  // Huawei
            { namePrefix: 'OnePlus' }, // OnePlus
            { namePrefix: 'OPPO' }     // OPPO
          ],
          optionalServices: [
            this.HAPTIC_SERVICE_UUID, 
            this.AUTH_SERVICE_UUID,
            // Common Bluetooth services for broader compatibility
            '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
            '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
            '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
            '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
            '00001812-0000-1000-8000-00805f9b34fb'  // Human Interface Device
          ]
        };
      }
      
      // Request device with options
      this.device = await navigator.bluetooth.requestDevice(requestOptions);
      
      console.log('Device selected:', this.device.name);
      
      // Add event listener for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
      
      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.gattServer = await this.device.gatt.connect();
      
      // Log available services
      console.log('Discovering services...');
      const services = await this.gattServer.getPrimaryServices();
      console.log(`Found ${services.length} services:`);
      
      for (const service of services) {
        console.log(`Service UUID: ${service.uuid}`);
        try {
          const characteristics = await service.getCharacteristics();
          console.log(`  Found ${characteristics.length} characteristics:`);
          for (const characteristic of characteristics) {
            console.log(`  Characteristic UUID: ${characteristic.uuid}`);
            console.log(`  Properties: ${JSON.stringify(characteristic.properties)}`);
            
            // Store haptic characteristic if it matches
            if (characteristic.uuid === this.HAPTIC_CHARACTERISTIC_UUID) {
              this.hapticCharacteristic = characteristic;
              this.hapticService = service;
              console.log('Found haptic characteristic!');
            }
            
            // Store auth characteristic if it matches
            if (characteristic.uuid === this.AUTH_CHARACTERISTIC_UUID) {
              this.authCharacteristic = characteristic;
              this.authService = service;
              console.log('Found auth characteristic!');
            }
          }
        } catch (error) {
          console.warn(`Error getting characteristics for service ${service.uuid}:`, error);
        }
      }
      
      // Try to use a generic characteristic for haptic feedback if the specific one wasn't found
      if (!this.hapticCharacteristic) {
        console.log('Specific haptic characteristic not found, trying to use a generic one...');
        try {
          // Try to find a writeable characteristic from any service
          for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const characteristic of characteristics) {
              if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                console.log(`Using generic characteristic ${characteristic.uuid} for haptic feedback`);
                this.hapticCharacteristic = characteristic;
                this.hapticService = service;
                break;
              }
            }
            if (this.hapticCharacteristic) break;
          }
        } catch (error) {
          console.warn('Error finding generic characteristic:', error);
        }
      }
      
      this.isConnected = this.hapticCharacteristic !== null;
      
      if (this.isConnected) {
        console.log('Bluetooth connection established successfully!');
        return true;
      } else {
        console.error('Could not find a suitable characteristic for haptic feedback');
        return false;
      }
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
