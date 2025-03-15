/**
 * Haptic Feedback System for BrailleBuddy
 * 
 * This module provides biologically-inspired haptic feedback for braille learning,
 * using patterns that mimic natural tactile sensations.
 * 
 * Focused on biological haptic patterns that simulate real braille reading experience
 */

export enum HapticMode {
  BIOLOGICAL = 'biological',
  STANDARD = 'standard',
  RHYTHMIC = 'rhythmic',
  FREQUENCY = 'frequency'
}

export interface HapticOptions {
  mode: HapticMode;
  intensity: number; // 1-10
  duration: number; // in milliseconds
  pattern?: number[]; // custom pattern
}

// Default options
const defaultOptions: HapticOptions = {
  mode: HapticMode.BIOLOGICAL,
  intensity: 5,
  duration: 100
};

/**
 * Biological vibration patterns inspired by natural tactile sensations
 * These patterns are designed to mimic the feeling of reading physical braille
 */
const biologicalPatterns: Record<string, number[]> = {
  // Dot patterns (1-6) with biologically-inspired timing
  '1': [40, 30, 20], // Quick pulse with natural decay
  '2': [35, 25, 40], // Slightly longer sensation
  '3': [45, 20, 35], // Stronger initial contact
  '4': [30, 40, 30], // Balanced middle-strength
  '5': [25, 45, 30], // Gradual build-up
  '6': [50, 25, 25], // Strong distinct pulse
  
  // Common braille characters with biological patterns
  'a': [40, 30, 0, 0, 0, 0], // Dot 1
  'b': [40, 30, 35, 25, 0, 0], // Dots 1, 2
  'c': [40, 30, 0, 0, 45, 20], // Dots 1, 4
  'd': [40, 30, 0, 0, 45, 20, 30, 40], // Dots 1, 4, 5
  'e': [40, 30, 0, 0, 30, 40], // Dots 1, 5
  'f': [40, 30, 35, 25, 45, 20], // Dots 1, 2, 4
  
  // Special patterns for learning feedback
  'success': [40, 30, 60, 20, 80, 40], // Rising pattern for success
  'error': [100, 50, 80, 40, 60, 30], // Descending pattern for errors
  'progress': [20, 20, 40, 20, 60, 20, 80, 20], // Escalating pattern for progress
  
  // Consent management patterns
  'consent-granted': [30, 20, 50, 20, 70, 30, 90, 40], // Escalating positive pattern
  'consent-revoked': [80, 40, 60, 30, 40, 20, 20, 10], // Descending gentle pattern
  'consent-prompt': [40, 30, 40, 30, 40, 30], // Attention-getting pattern
  'warning': [60, 30, 0, 60, 30, 0, 60, 30] // Warning pattern for important notices
};

/**
 * Check if the Web Vibration API is available
 */
export function isHapticAvailable(): boolean {
  return 'navigator' in window && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback for a braille character or pattern
 * @param character The braille character or dot pattern
 * @param options Haptic feedback options
 */
export function triggerHapticFeedback(
  character: string,
  options: Partial<HapticOptions> = {}
): boolean {
  if (!isHapticAvailable()) {
    console.warn('Haptic feedback is not available on this device');
    return false;
  }
  
  // Merge with default options
  const mergedOptions: HapticOptions = {
    ...defaultOptions,
    ...options
  };
  
  // Get the appropriate pattern
  let pattern: number[];
  
  switch (mergedOptions.mode) {
    case HapticMode.BIOLOGICAL:
      // Use biologically-inspired patterns
      pattern = biologicalPatterns[character.toLowerCase()] || 
                biologicalPatterns['1']; // Default to dot 1 pattern
      
      // Scale intensity
      pattern = pattern.map(p => Math.round(p * (mergedOptions.intensity / 5)));
      break;
      
    case HapticMode.STANDARD:
      // Simple on-off pattern
      pattern = [mergedOptions.duration];
      break;
      
    case HapticMode.RHYTHMIC:
      // Rhythmic pattern based on dot count
      const dotCount = character.length;
      pattern = Array(dotCount).fill(mergedOptions.duration / 2);
      
      // Add pauses between vibrations
      const rhythmicPattern: number[] = [];
      pattern.forEach(p => {
        rhythmicPattern.push(p);
        rhythmicPattern.push(p / 2); // Pause between vibrations
      });
      pattern = rhythmicPattern;
      break;
      
    case HapticMode.FREQUENCY:
      // Frequency-based pattern (simulated with duration)
      const baseFrequency = 50; // Base duration in ms
      pattern = [baseFrequency * (11 - mergedOptions.intensity) / 5];
      break;
      
    default:
      // Custom pattern if provided, otherwise use standard
      pattern = mergedOptions.pattern || [mergedOptions.duration];
  }
  
  // Trigger vibration
  return navigator.vibrate(pattern);
}

/**
 * Stop any ongoing haptic feedback
 */
export function stopHapticFeedback(): boolean {
  if (!isHapticAvailable()) {
    return false;
  }
  
  return navigator.vibrate(0);
}

/**
 * Create a sequence of haptic feedback for a string of braille characters
 * @param text String of braille characters
 * @param options Haptic feedback options
 * @param delayBetweenCharacters Delay between characters in milliseconds
 */
export function hapticSequence(
  text: string,
  options: Partial<HapticOptions> = {},
  delayBetweenCharacters: number = 300
): void {
  if (!isHapticAvailable() || !text) {
    return;
  }
  
  const characters = text.split('');
  let currentIndex = 0;
  
  // Function to trigger haptic feedback for the current character
  const triggerNextCharacter = () => {
    if (currentIndex >= characters.length) {
      return;
    }
    
    const character = characters[currentIndex];
    triggerHapticFeedback(character, options);
    
    currentIndex++;
    
    // Schedule the next character
    if (currentIndex < characters.length) {
      setTimeout(triggerNextCharacter, delayBetweenCharacters);
    }
  };
  
  // Start the sequence
  triggerNextCharacter();
}

/**
 * Initialize the haptic feedback system
 * @returns True if haptic feedback is available
 */
export function initHapticFeedback(): boolean {
  const isAvailable = isHapticAvailable();
  
  if (isAvailable) {
    console.log('Haptic feedback system initialized');
    
    // Test vibration to ensure permissions are granted
    navigator.vibrate(1);
  } else {
    console.warn('Haptic feedback is not available on this device');
  }
  
  return isAvailable;
}
