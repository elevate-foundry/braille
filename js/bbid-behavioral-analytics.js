/**
 * BBID Behavioral Analytics Module
 * Provides advanced analysis of behavioral fingerprinting data
 */

class BBIDBehavioralAnalytics {
  /**
   * Initialize the behavioral analytics module
   */
  constructor() {
    this.deviceProfiles = {
      laptop: {
        keyboardWeight: 0.35,
        mouseWeight: 0.30,
        touchWeight: 0.05,
        motionWeight: 0.05,
        uiWeight: 0.15,
        sessionWeight: 0.10
      },
      smartphone: {
        keyboardWeight: 0.10,
        mouseWeight: 0.05,
        touchWeight: 0.35,
        motionWeight: 0.25,
        uiWeight: 0.15,
        sessionWeight: 0.10
      },
      tablet: {
        keyboardWeight: 0.15,
        mouseWeight: 0.10,
        touchWeight: 0.30,
        motionWeight: 0.20,
        uiWeight: 0.15,
        sessionWeight: 0.10
      }
    };
  }

  /**
   * Analyze behavioral data and generate a uniqueness score
   * @param {Object} behavioralData - Collected behavioral metrics
   * @returns {Object} Analysis results including uniqueness score and device type
   */
  analyzeFingerprint(behavioralData) {
    // Detect device type
    const deviceType = this.detectDeviceType(behavioralData);
    
    // Calculate component scores
    const keyboardScore = this.calculateKeyboardScore(behavioralData.keyboardMetrics);
    const mouseScore = this.calculateMouseScore(behavioralData.mouseMetrics);
    const touchScore = this.calculateTouchScore(behavioralData.touchMetrics);
    const motionScore = this.calculateMotionScore(behavioralData.motionMetrics);
    const uiScore = this.calculateUIScore(behavioralData.uiInteractions);
    const sessionScore = this.calculateSessionScore(behavioralData.sessionMetrics);
    
    // Apply device-specific weights
    const weights = this.deviceProfiles[deviceType];
    const weightedScore = 
      keyboardScore * weights.keyboardWeight +
      mouseScore * weights.mouseWeight +
      touchScore * weights.touchWeight +
      motionScore * weights.motionWeight +
      uiScore * weights.uiWeight +
      sessionScore * weights.sessionWeight;
    
    // Calculate confidence based on data completeness
    const dataCompleteness = this.calculateDataCompleteness(behavioralData);
    
    return {
      deviceType,
      uniquenessScore: weightedScore,
      confidence: dataCompleteness,
      componentScores: {
        keyboard: keyboardScore,
        mouse: mouseScore,
        touch: touchScore,
        motion: motionScore,
        ui: uiScore,
        session: sessionScore
      },
      behavioralSummary: this.generateBehavioralSummary(behavioralData)
    };
  }

  /**
   * Detect the type of device based on behavioral patterns
   * @param {Object} data - Behavioral data
   * @returns {string} Device type (laptop, smartphone, tablet)
   */
  detectDeviceType(data) {
    // Check for touch events as primary indicator
    const hasTouchEvents = data.touchMetrics && data.touchMetrics.touchCount > 0;
    
    // Check for motion events as secondary indicator
    const hasMotionEvents = data.motionMetrics && 
      (data.motionMetrics.orientationSamples.length > 0 || 
       data.motionMetrics.accelerationSamples.length > 0);
    
    // Check for keyboard events
    const hasKeyboardEvents = data.keyboardMetrics && data.keyboardMetrics.keyPressCount > 0;
    
    // Check for mouse events
    const hasMouseEvents = data.mouseMetrics && data.mouseMetrics.moveCount > 0;
    
    // Check screen size if available
    const screenSize = data.sessionMetrics && data.sessionMetrics.screenSize;
    let screenWidth = 0;
    let screenHeight = 0;
    
    if (screenSize) {
      const dimensions = screenSize.split('x');
      screenWidth = parseInt(dimensions[0], 10);
      screenHeight = parseInt(dimensions[1], 10);
    }
    
    // Decision logic
    if (hasTouchEvents) {
      if (screenWidth > 0) {
        // Use screen size to differentiate between tablet and smartphone
        if (Math.max(screenWidth, screenHeight) >= 900) {
          return 'tablet';
        } else {
          return 'smartphone';
        }
      } else {
        // If no screen size, use motion intensity as a heuristic
        if (hasMotionEvents && this.calculateMotionIntensity(data.motionMetrics) > 5) {
          return 'smartphone';
        } else {
          return 'tablet';
        }
      }
    } else if (hasKeyboardEvents && hasMouseEvents) {
      return 'laptop';
    } else if (hasMouseEvents) {
      return 'laptop'; // Default to laptop if only mouse events
    } else if (hasKeyboardEvents) {
      return 'laptop'; // Default to laptop if only keyboard events
    }
    
    // Default case
    return 'laptop';
  }

  /**
   * Calculate keyboard uniqueness score (0-10)
   * @param {Object} keyboardMetrics - Keyboard metrics data
   * @returns {number} Uniqueness score
   */
  calculateKeyboardScore(keyboardMetrics) {
    if (!keyboardMetrics || keyboardMetrics.keyPressCount < 10) {
      return 0; // Not enough data
    }
    
    let score = 0;
    
    // Typing speed (0-2 points)
    if (keyboardMetrics.averageTypingSpeed > 0) {
      score += Math.min(keyboardMetrics.averageTypingSpeed / 150, 1) * 2;
    }
    
    // Key press intervals variance (0-2 points)
    if (keyboardMetrics.keyPressIntervals.length > 5) {
      const variance = this.calculateVariance(keyboardMetrics.keyPressIntervals);
      score += Math.min(variance / 5000, 1) * 2;
    }
    
    // Key hold durations (0-2 points)
    if (keyboardMetrics.keyHoldDurations && keyboardMetrics.keyHoldDurations.length > 5) {
      const variance = this.calculateVariance(keyboardMetrics.keyHoldDurations);
      score += Math.min(variance / 1000, 1) * 2;
    }
    
    // Key distribution (0-2 points)
    if (keyboardMetrics.keyCodes && Object.keys(keyboardMetrics.keyCodes).length > 0) {
      const keyDistributionScore = Object.keys(keyboardMetrics.keyCodes).length / 30;
      score += Math.min(keyDistributionScore, 1) * 2;
    }
    
    // Error rate (0-2 points)
    if (typeof keyboardMetrics.errorRate === 'number') {
      // Normalize error rate to a 0-2 score (moderate error rates are more unique)
      const normalizedErrorRate = Math.abs(keyboardMetrics.errorRate - 0.05) / 0.05;
      score += (1 - Math.min(normalizedErrorRate, 1)) * 2;
    }
    
    return score;
  }

  /**
   * Calculate mouse uniqueness score (0-10)
   * @param {Object} mouseMetrics - Mouse metrics data
   * @returns {number} Uniqueness score
   */
  calculateMouseScore(mouseMetrics) {
    if (!mouseMetrics || mouseMetrics.moveCount < 10) {
      return 0; // Not enough data
    }
    
    let score = 0;
    
    // Movement speed (0-2 points)
    if (mouseMetrics.averageSpeed > 0) {
      score += Math.min(mouseMetrics.averageSpeed / 1000, 1) * 2;
    }
    
    // Click frequency (0-2 points)
    if (mouseMetrics.clickCount > 0 && mouseMetrics.moveCount > 0) {
      const clickRatio = mouseMetrics.clickCount / mouseMetrics.moveCount;
      score += Math.min(clickRatio * 100, 1) * 2;
    }
    
    // Movement patterns (0-2 points)
    if (mouseMetrics.positions && mouseMetrics.positions.length > 10) {
      // Calculate curvature of mouse movements
      const curvatureScore = this.calculateMovementCurvature(mouseMetrics.positions);
      score += Math.min(curvatureScore, 1) * 2;
    }
    
    // Click distribution (0-2 points)
    if (mouseMetrics.clickPositions && mouseMetrics.clickPositions.length > 3) {
      const entropy = this.calculatePositionalEntropy(mouseMetrics.clickPositions);
      score += Math.min(entropy / 5, 1) * 2;
    }
    
    // Click duration (0-2 points)
    if (mouseMetrics.clickDurations && mouseMetrics.clickDurations.length > 3) {
      const variance = this.calculateVariance(mouseMetrics.clickDurations);
      score += Math.min(variance / 10000, 1) * 2;
    }
    
    return score;
  }

  /**
   * Calculate touch uniqueness score (0-10)
   * @param {Object} touchMetrics - Touch metrics data
   * @returns {number} Uniqueness score
   */
  calculateTouchScore(touchMetrics) {
    if (!touchMetrics || touchMetrics.touchCount < 5) {
      return 0; // Not enough data
    }
    
    let score = 0;
    
    // Touch pressure (0-2 points)
    if (touchMetrics.pressures && touchMetrics.pressures.length > 0) {
      const pressureVariance = this.calculateVariance(touchMetrics.pressures);
      score += Math.min(pressureVariance * 10, 1) * 2;
    }
    
    // Touch area (0-2 points)
    if (touchMetrics.touchAreas && touchMetrics.touchAreas.length > 0) {
      const areaVariance = this.calculateVariance(touchMetrics.touchAreas);
      score += Math.min(areaVariance / 1000, 1) * 2;
    }
    
    // Swipe patterns (0-2 points)
    if (touchMetrics.swipeSpeeds && touchMetrics.swipeSpeeds.length > 0) {
      const swipeSpeedVariance = this.calculateVariance(touchMetrics.swipeSpeeds);
      score += Math.min(swipeSpeedVariance / 5000, 1) * 2;
    }
    
    // Multi-touch usage (0-2 points)
    if (touchMetrics.multiTouchEvents > 0) {
      const multiTouchRatio = touchMetrics.multiTouchEvents / touchMetrics.touchCount;
      score += Math.min(multiTouchRatio * 5, 1) * 2;
    }
    
    // Tap speed (0-2 points)
    if (touchMetrics.tapSpeed && touchMetrics.tapSpeed.length > 0) {
      const tapSpeedVariance = this.calculateVariance(touchMetrics.tapSpeed);
      score += Math.min(tapSpeedVariance / 10000, 1) * 2;
    }
    
    return score;
  }

  /**
   * Calculate motion uniqueness score (0-10)
   * @param {Object} motionMetrics - Motion metrics data
   * @returns {number} Uniqueness score
   */
  calculateMotionScore(motionMetrics) {
    if (!motionMetrics || 
        (motionMetrics.orientationSamples.length < 5 && 
         motionMetrics.accelerationSamples.length < 5)) {
      return 0; // Not enough data
    }
    
    let score = 0;
    
    // Device stability (0-3 points)
    if (typeof motionMetrics.stability === 'number') {
      score += (1 - Math.min(motionMetrics.stability, 1)) * 3;
    }
    
    // Orientation changes (0-3 points)
    if (motionMetrics.orientationSamples && motionMetrics.orientationSamples.length > 0) {
      const orientationVariance = this.calculateOrientationVariance(motionMetrics.orientationSamples);
      score += Math.min(orientationVariance / 1000, 1) * 3;
    }
    
    // Movement intensity (0-4 points)
    if (motionMetrics.accelerationSamples && motionMetrics.accelerationSamples.length > 0) {
      const motionIntensity = this.calculateMotionIntensity(motionMetrics);
      score += Math.min(motionIntensity / 10, 1) * 4;
    }
    
    return score;
  }

  /**
   * Calculate UI interaction uniqueness score (0-10)
   * @param {Object} uiMetrics - UI interaction metrics
   * @returns {number} Uniqueness score
   */
  calculateUIScore(uiMetrics) {
    if (!uiMetrics) {
      return 0;
    }
    
    let score = 0;
    
    // Tab switching (0-2 points)
    if (uiMetrics.tabSwitches > 0) {
      score += Math.min(uiMetrics.tabSwitches / 10, 1) * 2;
    }
    
    // Form interactions (0-2 points)
    if (uiMetrics.formInteractions > 0) {
      score += Math.min(uiMetrics.formInteractions / 5, 1) * 2;
    }
    
    // Navigation patterns (0-2 points)
    if (uiMetrics.navigationPatterns && uiMetrics.navigationPatterns.length > 0) {
      score += Math.min(uiMetrics.navigationPatterns.length / 5, 1) * 2;
    }
    
    // Interaction density (0-2 points)
    if (uiMetrics.interactionCount > 0) {
      score += Math.min(uiMetrics.interactionCount / 50, 1) * 2;
    }
    
    // Focus/blur events (0-2 points)
    if (uiMetrics.focusEvents > 0 || uiMetrics.blurEvents > 0) {
      const focusBlurRatio = uiMetrics.focusEvents / Math.max(1, uiMetrics.blurEvents);
      score += Math.min(Math.abs(focusBlurRatio - 1) * 2, 1) * 2;
    }
    
    return score;
  }

  /**
   * Calculate session uniqueness score (0-10)
   * @param {Object} sessionMetrics - Session metrics data
   * @returns {number} Uniqueness score
   */
  calculateSessionScore(sessionMetrics) {
    if (!sessionMetrics) {
      return 0;
    }
    
    let score = 0;
    
    // Time of day pattern (0-2 points)
    if (typeof sessionMetrics.timeOfDay === 'number') {
      // Time of day is more unique during non-peak hours
      const hourFactor = Math.abs(sessionMetrics.timeOfDay - 12) / 12;
      score += hourFactor * 2;
    }
    
    // Day of week pattern (0-2 points)
    if (typeof sessionMetrics.dayOfWeek === 'number') {
      // Weekend usage is more unique
      const weekendFactor = (sessionMetrics.dayOfWeek === 0 || sessionMetrics.dayOfWeek === 6) ? 1 : 0.5;
      score += weekendFactor * 2;
    }
    
    // Session frequency (0-2 points)
    if (typeof sessionMetrics.sessionCount === 'number') {
      score += Math.min(sessionMetrics.sessionCount / 10, 1) * 2;
    }
    
    // Active time ratio (0-2 points)
    if (sessionMetrics.activeTime > 0 && sessionMetrics.totalTime > 0) {
      const activeRatio = sessionMetrics.activeTime / sessionMetrics.totalTime;
      score += Math.min(activeRatio, 1) * 2;
    }
    
    // Language and timezone (0-2 points)
    if (sessionMetrics.language && sessionMetrics.timezone) {
      // Just a placeholder - in reality would compare against population distributions
      score += 2;
    }
    
    return score;
  }

  /**
   * Calculate the completeness of the behavioral data (0-1)
   * @param {Object} data - Behavioral data
   * @returns {number} Completeness score
   */
  calculateDataCompleteness(data) {
    const metrics = [
      data.keyboardMetrics && data.keyboardMetrics.keyPressCount > 10,
      data.mouseMetrics && data.mouseMetrics.moveCount > 10,
      data.touchMetrics && data.touchMetrics.touchCount > 5,
      data.motionMetrics && (
        data.motionMetrics.orientationSamples.length > 5 || 
        data.motionMetrics.accelerationSamples.length > 5
      ),
      data.uiInteractions && data.uiInteractions.interactionCount > 0,
      data.sessionMetrics && data.sessionMetrics.activeTime > 0
    ];
    
    const presentMetrics = metrics.filter(Boolean).length;
    return presentMetrics / metrics.length;
  }

  /**
   * Calculate variance of an array of numbers
   * @param {Array} values - Array of numeric values
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (!values || values.length < 2) {
      return 0;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate curvature of mouse movements
   * @param {Array} positions - Array of position objects {x, y, time}
   * @returns {number} Curvature score
   */
  calculateMovementCurvature(positions) {
    if (!positions || positions.length < 3) {
      return 0;
    }
    
    let totalCurvature = 0;
    
    for (let i = 2; i < positions.length; i++) {
      const p1 = positions[i - 2];
      const p2 = positions[i - 1];
      const p3 = positions[i];
      
      // Calculate vectors
      const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
      
      // Calculate magnitudes
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      // Calculate dot product
      const dotProduct = v1.x * v2.x + v1.y * v2.y;
      
      // Calculate angle (in radians)
      const cosAngle = mag1 * mag2 > 0 ? dotProduct / (mag1 * mag2) : 0;
      const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      
      totalCurvature += angle;
    }
    
    return totalCurvature / (positions.length - 2);
  }

  /**
   * Calculate positional entropy of click positions
   * @param {Array} positions - Array of position objects {x, y}
   * @returns {number} Entropy score
   */
  calculatePositionalEntropy(positions) {
    if (!positions || positions.length < 3) {
      return 0;
    }
    
    // Divide screen into a grid and count clicks in each cell
    const gridSize = 10;
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    positions.forEach(pos => {
      const x = Math.floor(pos.x / (window.innerWidth / gridSize));
      const y = Math.floor(pos.y / (window.innerHeight / gridSize));
      
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        grid[y][x]++;
      }
    });
    
    // Calculate entropy
    let totalClicks = positions.length;
    let entropy = 0;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x] > 0) {
          const p = grid[y][x] / totalClicks;
          entropy -= p * Math.log2(p);
        }
      }
    }
    
    return entropy;
  }

  /**
   * Calculate orientation variance from orientation samples
   * @param {Array} samples - Array of orientation objects {alpha, beta, gamma}
   * @returns {number} Orientation variance
   */
  calculateOrientationVariance(samples) {
    if (!samples || samples.length < 3) {
      return 0;
    }
    
    // Calculate variance for each axis
    const alphaValues = samples.map(s => s.alpha).filter(v => typeof v === 'number');
    const betaValues = samples.map(s => s.beta).filter(v => typeof v === 'number');
    const gammaValues = samples.map(s => s.gamma).filter(v => typeof v === 'number');
    
    const alphaVariance = this.calculateVariance(alphaValues);
    const betaVariance = this.calculateVariance(betaValues);
    const gammaVariance = this.calculateVariance(gammaValues);
    
    return alphaVariance + betaVariance + gammaVariance;
  }

  /**
   * Calculate motion intensity from acceleration samples
   * @param {Object} motionMetrics - Motion metrics object
   * @returns {number} Motion intensity score
   */
  calculateMotionIntensity(motionMetrics) {
    if (!motionMetrics || !motionMetrics.accelerationSamples || motionMetrics.accelerationSamples.length < 3) {
      return 0;
    }
    
    // Calculate average acceleration magnitude
    const magnitudes = motionMetrics.accelerationSamples.map(sample => {
      const x = sample.x || 0;
      const y = sample.y || 0;
      const z = sample.z || 0;
      return Math.sqrt(x*x + y*y + z*z);
    });
    
    // Calculate mean and variance
    const mean = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    const variance = this.calculateVariance(magnitudes);
    
    // Combine mean and variance for an intensity score
    return mean + Math.sqrt(variance);
  }

  /**
   * Generate a human-readable summary of behavioral patterns
   * @param {Object} data - Behavioral data
   * @returns {Object} Behavioral summary
   */
  generateBehavioralSummary(data) {
    const deviceType = this.detectDeviceType(data);
    
    const summary = {
      deviceType: deviceType,
      keyboardUsage: data.keyboardMetrics ? this.summarizeKeyboardUsage(data.keyboardMetrics) : 'No keyboard data',
      mouseUsage: data.mouseMetrics ? this.summarizeMouseUsage(data.mouseMetrics) : 'No mouse data',
      touchUsage: data.touchMetrics ? this.summarizeTouchUsage(data.touchMetrics) : 'No touch data',
      motionPatterns: data.motionMetrics ? this.summarizeMotionPatterns(data.motionMetrics) : 'No motion data',
      uiPatterns: data.uiInteractions ? this.summarizeUIPatterns(data.uiInteractions) : 'No UI data',
      sessionPatterns: data.sessionMetrics ? this.summarizeSessionPatterns(data.sessionMetrics) : 'No session data'
    };
    
    return summary;
  }

  /**
   * Summarize keyboard usage patterns
   * @param {Object} keyboardMetrics - Keyboard metrics
   * @returns {string} Summary
   */
  summarizeKeyboardUsage(keyboardMetrics) {
    if (keyboardMetrics.keyPressCount < 10) {
      return 'Minimal keyboard usage';
    }
    
    let typingSpeed = 'average';
    if (keyboardMetrics.averageTypingSpeed > 80) {
      typingSpeed = 'fast';
    } else if (keyboardMetrics.averageTypingSpeed < 40) {
      typingSpeed = 'slow';
    }
    
    let errorRate = 'average';
    if (keyboardMetrics.errorRate > 0.1) {
      errorRate = 'high';
    } else if (keyboardMetrics.errorRate < 0.03) {
      errorRate = 'low';
    }
    
    return `${typingSpeed} typing speed with ${errorRate} error rate`;
  }

  /**
   * Summarize mouse usage patterns
   * @param {Object} mouseMetrics - Mouse metrics
   * @returns {string} Summary
   */
  summarizeMouseUsage(mouseMetrics) {
    if (mouseMetrics.moveCount < 10) {
      return 'Minimal mouse usage';
    }
    
    let moveSpeed = 'average';
    if (mouseMetrics.averageSpeed > 500) {
      moveSpeed = 'fast';
    } else if (mouseMetrics.averageSpeed < 200) {
      moveSpeed = 'slow';
    }
    
    let clickFrequency = 'average';
    const clickRatio = mouseMetrics.clickCount / mouseMetrics.moveCount;
    if (clickRatio > 0.1) {
      clickFrequency = 'high';
    } else if (clickRatio < 0.03) {
      clickFrequency = 'low';
    }
    
    return `${moveSpeed} cursor movement with ${clickFrequency} click frequency`;
  }

  /**
   * Summarize touch usage patterns
   * @param {Object} touchMetrics - Touch metrics
   * @returns {string} Summary
   */
  summarizeTouchUsage(touchMetrics) {
    if (touchMetrics.touchCount < 5) {
      return 'Minimal touch interaction';
    }
    
    let touchPressure = 'average';
    if (touchMetrics.averagePressure > 0.7) {
      touchPressure = 'firm';
    } else if (touchMetrics.averagePressure < 0.3) {
      touchPressure = 'light';
    }
    
    let multiTouchUsage = 'rare';
    if (touchMetrics.multiTouchEvents > touchMetrics.touchCount * 0.3) {
      multiTouchUsage = 'frequent';
    } else if (touchMetrics.multiTouchEvents > touchMetrics.touchCount * 0.1) {
      multiTouchUsage = 'occasional';
    }
    
    return `${touchPressure} touch pressure with ${multiTouchUsage} multi-touch gestures`;
  }

  /**
   * Summarize motion patterns
   * @param {Object} motionMetrics - Motion metrics
   * @returns {string} Summary
   */
  summarizeMotionPatterns(motionMetrics) {
    if (motionMetrics.accelerationSamples.length < 5 && motionMetrics.orientationSamples.length < 5) {
      return 'Minimal motion data';
    }
    
    let stability = 'average';
    if (motionMetrics.stability > 0.8) {
      stability = 'very stable';
    } else if (motionMetrics.stability < 0.3) {
      stability = 'unstable';
    }
    
    return `${stability} device handling`;
  }

  /**
   * Summarize UI interaction patterns
   * @param {Object} uiMetrics - UI metrics
   * @returns {string} Summary
   */
  summarizeUIPatterns(uiMetrics) {
    if (!uiMetrics.interactionCount) {
      return 'Minimal UI interaction';
    }
    
    let interactionDensity = 'average';
    if (uiMetrics.interactionCount > 50) {
      interactionDensity = 'high';
    } else if (uiMetrics.interactionCount < 10) {
      interactionDensity = 'low';
    }
    
    return `${interactionDensity} UI interaction density`;
  }

  /**
   * Summarize session patterns
   * @param {Object} sessionMetrics - Session metrics
   * @returns {string} Summary
   */
  summarizeSessionPatterns(sessionMetrics) {
    if (!sessionMetrics.activeTime) {
      return 'Minimal session data';
    }
    
    let activityLevel = 'average';
    if (sessionMetrics.activeTime > sessionMetrics.totalTime * 0.8) {
      activityLevel = 'highly active';
    } else if (sessionMetrics.activeTime < sessionMetrics.totalTime * 0.3) {
      activityLevel = 'mostly inactive';
    }
    
    return `${activityLevel} session`;
  }
}

// Export for browser and Node.js environments
if (typeof window !== 'undefined') {
  window.BBIDBehavioralAnalytics = BBIDBehavioralAnalytics;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = BBIDBehavioralAnalytics;
}
