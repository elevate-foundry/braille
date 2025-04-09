/**
 * Samsung Watch Connector
 * 
 * This module provides connectivity between a Mac and Samsung watches using Web Bluetooth API.
 * It extends the BrailleBuddyBluetoothAPI to specifically handle Samsung watch detection and data visualization.
 */

import BrailleBuddyBluetoothAPI from './src/bluetooth-api.js';

class SamsungWatchConnector extends BrailleBuddyBluetoothAPI {
  constructor() {
    super();
    
    // Samsung-specific UUIDs
    // These are standard GATT service UUIDs that Samsung watches typically use
    this.SAMSUNG_HEALTH_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb'; // Heart Rate Service
    this.SAMSUNG_DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb'; // Device Information Service
    this.SAMSUNG_BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'; // Battery Service
    
    // Characteristics
    this.HEART_RATE_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate Measurement
    this.BATTERY_LEVEL_CHAR_UUID = '00002a19-0000-1000-8000-00805f9b34fb'; // Battery Level
    
    // Additional properties
    this.watchData = {
      heartRate: 0,
      batteryLevel: 0,
      steps: 0,
      lastUpdated: null
    };
    
    // Visualization data
    this.visualizationCallbacks = [];
  }

  /**
   * Initialize the Samsung Watch connector
   * @returns {Promise<boolean>}
   */
  async initialize() {
    const bluetoothAvailable = await super.initialize();
    
    if (!bluetoothAvailable) {
      console.error('Bluetooth not available on this device');
      return false;
    }
    
    console.log('Samsung Watch Connector initialized successfully');
    return true;
  }

  /**
   * Scan for Samsung watches
   * @returns {Promise<boolean>}
   */
  async scanForWatches() {
    try {
      console.log('Scanning for Samsung watches...');
      
      // Request device with Samsung-specific filters
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SAMSUNG_HEALTH_SERVICE_UUID] },
          { services: [this.SAMSUNG_DEVICE_INFO_SERVICE_UUID] },
          { namePrefix: 'Galaxy Watch' },
          { namePrefix: 'Samsung' }
        ],
        optionalServices: [
          this.SAMSUNG_HEALTH_SERVICE_UUID,
          this.SAMSUNG_DEVICE_INFO_SERVICE_UUID,
          this.SAMSUNG_BATTERY_SERVICE_UUID
        ]
      });
      
      if (!this.device) {
        throw new Error('No Samsung watch selected');
      }
      
      console.log('Samsung watch found:', this.device.name);
      return true;
    } catch (error) {
      console.error('Error scanning for Samsung watches:', error);
      this._notifyListeners('onError', { error });
      return false;
    }
  }

  /**
   * Connect to the Samsung watch
   * @returns {Promise<boolean>}
   */
  async connectToWatch() {
    try {
      if (!this.device) {
        const scanResult = await this.scanForWatches();
        if (!scanResult) {
          return false;
        }
      }
      
      // Add event listener for disconnection
      this.device.addEventListener('gattserverdisconnected', this._onDisconnected.bind(this));
      
      // Connect to GATT server
      console.log('Connecting to Samsung watch GATT server...');
      this.server = await this.device.gatt.connect();
      
      // Get services
      console.log('Getting Samsung watch services...');
      
      // Heart Rate Service
      try {
        const heartRateService = await this.server.getPrimaryService(this.SAMSUNG_HEALTH_SERVICE_UUID);
        const heartRateChar = await heartRateService.getCharacteristic(this.HEART_RATE_CHAR_UUID);
        
        // Start notifications for heart rate
        await heartRateChar.startNotifications();
        heartRateChar.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          // Heart rate is in the 2nd byte for most heart rate sensors
          this.watchData.heartRate = value.getUint8(1);
          this.watchData.lastUpdated = new Date();
          this._updateVisualization();
        });
        
        console.log('Heart rate monitoring started');
      } catch (error) {
        console.warn('Heart rate service not available:', error);
      }
      
      // Battery Service
      try {
        const batteryService = await this.server.getPrimaryService(this.SAMSUNG_BATTERY_SERVICE_UUID);
        const batteryChar = await batteryService.getCharacteristic(this.BATTERY_LEVEL_CHAR_UUID);
        
        // Read battery level
        const batteryValue = await batteryChar.readValue();
        this.watchData.batteryLevel = batteryValue.getUint8(0);
        
        // Start notifications for battery updates
        await batteryChar.startNotifications();
        batteryChar.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          this.watchData.batteryLevel = value.getUint8(0);
          this.watchData.lastUpdated = new Date();
          this._updateVisualization();
        });
        
        console.log('Battery monitoring started');
      } catch (error) {
        console.warn('Battery service not available:', error);
      }
      
      this.isConnected = true;
      this._notifyListeners('onConnected', { device: this.device });
      
      console.log('Samsung watch connected successfully');
      return true;
    } catch (error) {
      console.error('Samsung watch connection error:', error);
      this._notifyListeners('onError', { error });
      return false;
    }
  }

  /**
   * Register a callback for visualization updates
   * @param {Function} callback - Function to call with updated watch data
   */
  registerVisualizationCallback(callback) {
    if (typeof callback === 'function') {
      this.visualizationCallbacks.push(callback);
    }
  }

  /**
   * Update visualization with latest watch data
   * @private
   */
  _updateVisualization() {
    // Call all registered visualization callbacks with the current data
    this.visualizationCallbacks.forEach(callback => {
      callback(this.watchData);
    });
  }
}

export default SamsungWatchConnector;
