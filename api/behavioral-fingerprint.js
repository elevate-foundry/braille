// Behavioral Fingerprinting API
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { setCorsHeaders, convertToBBID, calculateMetrics } = require('./utils');
const { logApiRequest } = require('./middleware');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Log this API request
  await logApiRequest(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { 
      deviceId,
      keyboardMetrics,
      mouseMetrics,
      touchMetrics,
      motionMetrics,
      interactionFlow,
      timeOnPage,
      scrollPatterns,
      formInteractions,
      additionalData
    } = req.body;

    // Validate required parameters
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing required parameter: deviceId' });
    }

    // Create behavioral fingerprint object
    const behavioralFingerprint = {
      timestamp: new Date(),
      deviceId,
      keyboardMetrics: keyboardMetrics || null,
      mouseMetrics: mouseMetrics || null,
      touchMetrics: touchMetrics || null,
      motionMetrics: motionMetrics || null,
      interactionFlow: interactionFlow || null,
      timeOnPage: timeOnPage || null,
      scrollPatterns: scrollPatterns || null,
      formInteractions: formInteractions || null,
      additionalData: additionalData || null
    };

    // Generate a traditional fingerprint string from the behavioral data
    const traditionalFingerprint = generateTraditionalBehavioralFingerprint(behavioralFingerprint);
    
    // Convert to BBID format
    const bbidFingerprint = convertToBBID(traditionalFingerprint);
    
    // Calculate metrics
    const metrics = calculateMetrics(traditionalFingerprint, bbidFingerprint);

    // Store in MongoDB if connection string is available
    const uri = process.env.MONGODB_URI;
    if (uri) {
      const client = new MongoClient(uri);
      await client.connect();
      const database = client.db('bbid');
      const behavioralCollection = database.collection('behavioral_fingerprints');
      
      await behavioralCollection.insertOne({
        ...behavioralFingerprint,
        traditionalFingerprint,
        bbidFingerprint,
        metrics
      });
      
      await client.close();
    }

    // Return the results
    return res.status(200).json({
      success: true,
      deviceId,
      traditionalFingerprint,
      bbidFingerprint,
      metrics
    });
  } catch (error) {
    console.error('Behavioral fingerprinting error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Generate a traditional fingerprint from behavioral data
function generateTraditionalBehavioralFingerprint(data) {
  // Create a deterministic JSON string from the data
  const sortedData = sortObjectKeys(data);
  const jsonString = JSON.stringify(sortedData);
  
  // Generate a hash from the JSON string
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  
  // Create a more detailed fingerprint with behavioral characteristics
  const keyboardProfile = data.keyboardMetrics ? extractKeyboardProfile(data.keyboardMetrics) : 'no-keyboard';
  const mouseProfile = data.mouseMetrics ? extractMouseProfile(data.mouseMetrics) : 'no-mouse';
  const touchProfile = data.touchMetrics ? extractTouchProfile(data.touchMetrics) : 'no-touch';
  const motionProfile = data.motionMetrics ? extractMotionProfile(data.motionMetrics) : 'no-motion';
  
  // Combine profiles with hash to create a rich fingerprint
  return `bhv:${keyboardProfile}:${mouseProfile}:${touchProfile}:${motionProfile}:${hash.substring(0, 16)}`;
}

// Sort object keys for deterministic JSON serialization
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortObjectKeys(obj[key]);
    return sorted;
  }, {});
}

// Extract keyboard behavior profile
function extractKeyboardProfile(keyboardMetrics) {
  if (!keyboardMetrics) return 'unknown';
  
  // Extract typing speed if available
  const typingSpeed = keyboardMetrics.averageTypingSpeed || keyboardMetrics.typingSpeed;
  
  // Extract typing rhythm if available
  const typingRhythm = keyboardMetrics.typingRhythm || keyboardMetrics.keyPressIntervals;
  
  // Create keyboard profile categories
  let speedCategory = 'unknown';
  if (typingSpeed) {
    if (typingSpeed < 30) speedCategory = 'slow';
    else if (typingSpeed < 70) speedCategory = 'medium';
    else speedCategory = 'fast';
  }
  
  let rhythmCategory = 'unknown';
  if (typingRhythm) {
    // Simple analysis of rhythm consistency
    if (Array.isArray(typingRhythm)) {
      const sum = typingRhythm.reduce((a, b) => a + b, 0);
      const avg = sum / typingRhythm.length;
      const variance = typingRhythm.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / typingRhythm.length;
      
      if (variance < 1000) rhythmCategory = 'consistent';
      else if (variance < 5000) rhythmCategory = 'moderate';
      else rhythmCategory = 'variable';
    }
  }
  
  return `kbd:${speedCategory}:${rhythmCategory}`;
}

// Extract mouse behavior profile
function extractMouseProfile(mouseMetrics) {
  if (!mouseMetrics) return 'unknown';
  
  // Extract mouse speed if available
  const mouseSpeed = mouseMetrics.averageSpeed || mouseMetrics.speed;
  
  // Extract mouse movement pattern if available
  const movementPattern = mouseMetrics.movementPattern || mouseMetrics.trajectory;
  
  // Create mouse profile categories
  let speedCategory = 'unknown';
  if (mouseSpeed) {
    if (mouseSpeed < 100) speedCategory = 'slow';
    else if (mouseSpeed < 300) speedCategory = 'medium';
    else speedCategory = 'fast';
  }
  
  let patternCategory = 'unknown';
  if (movementPattern) {
    if (typeof movementPattern === 'string') {
      patternCategory = movementPattern;
    } else if (Array.isArray(movementPattern)) {
      // Analyze movement pattern for straightness vs. curviness
      // This is a simplified approach
      patternCategory = movementPattern.length < 10 ? 'direct' : 'exploratory';
    }
  }
  
  return `mouse:${speedCategory}:${patternCategory}`;
}

// Extract touch behavior profile
function extractTouchProfile(touchMetrics) {
  if (!touchMetrics) return 'unknown';
  
  // Extract touch pressure if available
  const pressure = touchMetrics.averagePressure || touchMetrics.pressure;
  
  // Extract touch area if available
  const touchArea = touchMetrics.averageTouchArea || touchMetrics.touchArea;
  
  // Create touch profile categories
  let pressureCategory = 'unknown';
  if (pressure) {
    if (pressure < 0.3) pressureCategory = 'light';
    else if (pressure < 0.7) pressureCategory = 'medium';
    else pressureCategory = 'firm';
  }
  
  let areaCategory = 'unknown';
  if (touchArea) {
    if (touchArea < 10) areaCategory = 'small';
    else if (touchArea < 20) areaCategory = 'medium';
    else areaCategory = 'large';
  }
  
  return `touch:${pressureCategory}:${areaCategory}`;
}

// Extract motion/orientation behavior profile
function extractMotionProfile(motionMetrics) {
  if (!motionMetrics) return 'unknown';
  
  // Extract device tilt if available
  const tilt = motionMetrics.averageTilt || motionMetrics.tilt;
  
  // Extract device stability if available
  const stability = motionMetrics.stability || motionMetrics.steadiness;
  
  // Create motion profile categories
  let tiltCategory = 'unknown';
  if (tilt) {
    if (tilt < 10) tiltCategory = 'flat';
    else if (tilt < 45) tiltCategory = 'angled';
    else tiltCategory = 'upright';
  }
  
  let stabilityCategory = 'unknown';
  if (stability) {
    if (typeof stability === 'number') {
      if (stability < 0.3) stabilityCategory = 'shaky';
      else if (stability < 0.7) stabilityCategory = 'moderate';
      else stabilityCategory = 'steady';
    } else if (typeof stability === 'string') {
      stabilityCategory = stability;
    }
  }
  
  return `motion:${tiltCategory}:${stabilityCategory}`;
}
