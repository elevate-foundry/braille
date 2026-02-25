/**
 * Braille Haptic Messenger
 * 
 * This module provides functionality to send haptic messages in braille format
 * from a Mac to a connected phone or watch via USB or Bluetooth.
 */

class BrailleHapticMessenger {
  constructor(bluetoothConnector = null) {
    // Store the Bluetooth connector if provided
    this.bluetoothConnector = bluetoothConnector;
    // Braille patterns (dots representation)
    this.braillePatterns = {
      'a': [1, 0, 0, 0, 0, 0], // ⠁
      'b': [1, 1, 0, 0, 0, 0], // ⠃
      'c': [1, 0, 0, 1, 0, 0], // ⠉
      'd': [1, 0, 0, 1, 1, 0], // ⠙
      'e': [1, 0, 0, 0, 1, 0], // ⠑
      'f': [1, 1, 0, 1, 0, 0], // ⠋
      'g': [1, 1, 0, 1, 1, 0], // ⠛
      'h': [1, 1, 0, 0, 1, 0], // ⠓
      'i': [0, 1, 0, 1, 0, 0], // ⠊
      'j': [0, 1, 0, 1, 1, 0], // ⠚
      'k': [1, 0, 1, 0, 0, 0], // ⠅
      'l': [1, 1, 1, 0, 0, 0], // ⠇
      'm': [1, 0, 1, 1, 0, 0], // ⠍
      'n': [1, 0, 1, 1, 1, 0], // ⠝
      'o': [1, 0, 1, 0, 1, 0], // ⠕
      'p': [1, 1, 1, 1, 0, 0], // ⠏
      'q': [1, 1, 1, 1, 1, 0], // ⠟
      'r': [1, 1, 1, 0, 1, 0], // ⠗
      's': [0, 1, 1, 1, 0, 0], // ⠎
      't': [0, 1, 1, 1, 1, 0], // ⠞
      'u': [1, 0, 1, 0, 0, 1], // ⠥
      'v': [1, 1, 1, 0, 0, 1], // ⠧
      'w': [0, 1, 0, 1, 1, 1], // ⠺
      'x': [1, 0, 1, 1, 0, 1], // ⠭
      'y': [1, 0, 1, 1, 1, 1], // ⠽
      'z': [1, 0, 1, 0, 1, 1], // ⠵
      ' ': [0, 0, 0, 0, 0, 0], // ⠀
      '.': [0, 0, 0, 0, 1, 1], // ⠨
      ',': [0, 0, 1, 0, 0, 0], // ⠂
      '!': [0, 0, 1, 1, 0, 1], // ⠖
      '?': [0, 0, 1, 0, 0, 1], // ⠢
      '\'': [0, 0, 1, 0, 0, 0], // ⠄
      '-': [0, 0, 0, 0, 0, 1], // ⠤
      ':': [0, 0, 1, 0, 1, 0]  // ⠒
    };
    
    // Haptic feedback patterns
    this.hapticPatterns = {
      standard: {
        dot: 100, // ms
        space: 100, // ms
        charSpace: 300, // ms
        wordSpace: 500 // ms
      },
      rhythmic: {
        dot: 80, // ms
        space: 80, // ms
        charSpace: 240, // ms
        wordSpace: 400 // ms
      },
      frequency: {
        dot: 50, // ms
        space: 50, // ms
        charSpace: 150, // ms
        wordSpace: 300 // ms
      }
    };
    
    // Default settings
    this.settings = {
      hapticMode: 'standard',
      intensity: 1.0, // 0.0 to 1.0
      useCustomPattern: false,
      customPattern: null
    };
    
    // ADB command templates
    this.adbCommands = {
      vibrate: 'adb shell am broadcast -a android.intent.action.VIBRATE --es duration "{duration}"',
      vibratePattern: 'adb shell am broadcast -a android.intent.action.VIBRATE_PATTERN --es pattern "{pattern}"'
    };
  }
  
  /**
   * Set haptic feedback settings
   * @param {Object} settings - Haptic feedback settings
   */
  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }
  
  /**
   * Set the Bluetooth connector
   * @param {Object} bluetoothConnector - The Bluetooth connector instance
   */
  setBluetoothConnector(bluetoothConnector) {
    console.log('Setting Bluetooth connector:', bluetoothConnector);
    this.bluetoothConnector = bluetoothConnector;
  }
  
  /**
   * Convert text to braille pattern arrays
   * @param {string} text - Text to convert to braille
   * @returns {Array} Array of braille patterns
   */
  textToBraillePatterns(text) {
    const lowerText = text.toLowerCase();
    const patterns = [];
    
    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i];
      if (this.braillePatterns[char]) {
        patterns.push(this.braillePatterns[char]);
      } else {
        // If character not found, use space
        patterns.push(this.braillePatterns[' ']);
      }
    }
    
    return patterns;
  }
  
  /**
   * Convert braille patterns to haptic vibration patterns
   * @param {Array} braillePatterns - Array of braille patterns
   * @returns {Array} Vibration pattern array (alternating durations: vibrate, pause, vibrate, ...)
   */
  braillePatternsToVibration(braillePatterns) {
    const hapticMode = this.hapticPatterns[this.settings.hapticMode];
    const vibrationPattern = [];
    
    // Apply intensity to durations
    const dotDuration = Math.round(hapticMode.dot * this.settings.intensity);
    const spaceDuration = hapticMode.space;
    const charSpaceDuration = hapticMode.charSpace;
    
    // For each braille character pattern
    for (let i = 0; i < braillePatterns.length; i++) {
      const pattern = braillePatterns[i];
      
      // For each dot in the pattern
      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === 1) {
          // Vibrate for a dot
          vibrationPattern.push(dotDuration);
          // Pause between dots
          vibrationPattern.push(spaceDuration);
        } else {
          // Longer pause for no dot
          vibrationPattern.push(0);
          vibrationPattern.push(spaceDuration);
        }
      }
      
      // Add pause between characters
      vibrationPattern.push(0);
      vibrationPattern.push(charSpaceDuration);
      
      // Add extra pause for space character
      if (JSON.stringify(pattern) === JSON.stringify(this.braillePatterns[' '])) {
        vibrationPattern.push(0);
        vibrationPattern.push(hapticMode.wordSpace - charSpaceDuration);
      }
    }
    
    return vibrationPattern;
  }
  
  /**
   * Generate ADB command to send haptic feedback to phone
   * @param {Array} vibrationPattern - Vibration pattern array
   * @returns {string} ADB command to execute
   */
  generateAdbCommand(vibrationPattern) {
    // Format the pattern as a comma-separated string
    const patternString = vibrationPattern.join(',');
    
    // Generate the ADB command
    return this.adbCommands.vibratePattern.replace('{pattern}', patternString);
  }
  
  /**
   * Send a braille message as haptic feedback to the phone
   * @param {string} message - Text message to send as braille haptic feedback
   * @param {string} deviceId - Optional device ID for ADB
   * @param {boolean} useBluetooth - Whether to use Bluetooth instead of ADB
   * @param {string} mode - Haptic mode (standard, rhythmic, frequency)
   * @param {number} intensity - Vibration intensity (0.1-1.0)
   * @returns {string|Promise} ADB command to execute or Promise if using Bluetooth
   */
  sendBrailleMessage(message, deviceId = null, useBluetooth = false, mode = null, intensity = null) {
    // Apply mode and intensity if provided
    if (mode) this.settings.hapticMode = mode;
    if (intensity) this.settings.intensity = intensity;
    
    console.log(`Sending braille message: "${message}" (Mode: ${this.settings.hapticMode}, Intensity: ${this.settings.intensity}, Bluetooth: ${useBluetooth})`);
    
    // Convert message to braille patterns
    const braillePatterns = this.textToBraillePatterns(message);
    console.log('Braille patterns:', braillePatterns);
    
    // Convert braille patterns to vibration pattern
    const vibrationPattern = this.braillePatternsToVibration(braillePatterns);
    console.log('Vibration pattern:', vibrationPattern);
    
    // If using Bluetooth and we have a Bluetooth connector
    if (useBluetooth && this.bluetoothConnector) {
      console.log('Using Bluetooth to send haptic message');
      return this.sendBrailleMessageViaBluetooth(vibrationPattern);
    } else {
      // Generate ADB command
      let adbCommand = this.generateAdbCommand(vibrationPattern);
      
      // Add device ID if provided
      if (deviceId) {
        adbCommand = adbCommand.replace('adb ', `adb -s ${deviceId} `);
      }
      
      console.log('Using ADB to send haptic message:', adbCommand);
      return adbCommand;
    }
  }
  
  /**
   * Send a braille message as haptic feedback via Bluetooth
   * @param {Array} vibrationPattern - Vibration pattern array
   * @returns {Promise} Promise that resolves when the message is sent
   */
  async sendBrailleMessageViaBluetooth(vibrationPattern) {
    if (!this.bluetoothConnector) {
      throw new Error('Bluetooth connector not provided');
    }
    
    if (!this.bluetoothConnector.isConnected) {
      throw new Error('Bluetooth not connected');
    }
    
    try {
      console.log('Sending haptic pattern via Bluetooth:', vibrationPattern);
      
      // Format the pattern for Bluetooth transmission
      const patternData = new Uint8Array(vibrationPattern);
      
      // Send the pattern via Bluetooth
      await this.bluetoothConnector.sendHapticPattern(patternData);
      console.log('Haptic pattern sent successfully via Bluetooth');
      
      return true;
    } catch (error) {
      console.error('Error sending haptic message via Bluetooth:', error);
      
      // Try using Web Vibration API as fallback
      if (navigator && navigator.vibrate) {
        console.log('Using Web Vibration API as fallback for braille message');
        navigator.vibrate(vibrationPattern);
        return true;
      }
      
      throw error;
    }
  }
  
  /**
   * Get the braille representation of a text message
   * @param {string} message - Text message
   * @returns {Array} Array of braille dot patterns
   */
  getBrailleRepresentation(message) {
    return this.textToBraillePatterns(message);
  }
  
  /**
   * Get the Unicode braille characters for a text message
   * @param {string} message - Text message
   * @returns {string} Unicode braille representation
   */
  getUnicodeBraille(message) {
    const braillePatterns = this.textToBraillePatterns(message);
    let unicodeBraille = '';
    
    for (const pattern of braillePatterns) {
      // Convert binary pattern to Unicode braille
      let codePoint = 0x2800;
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === 1) {
          // Set the corresponding bit
          codePoint |= (1 << i);
        }
      }
      unicodeBraille += String.fromCodePoint(codePoint);
    }
    
    return unicodeBraille;
  }
}

export default BrailleHapticMessenger;
