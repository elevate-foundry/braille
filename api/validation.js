// Validation API for BBID
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { setCorsHeaders, convertToBBID, calculateMetrics } = require('./utils');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { testType, sampleSize = 100, fingerprintType } = req.body;

    // Validate parameters
    if (!testType) {
      return res.status(400).json({ error: 'Missing required parameter: testType' });
    }

    // Valid test types
    const validTestTypes = ['collision', 'comparison', 'information-loss', 'distribution'];
    if (!validTestTypes.includes(testType)) {
      return res.status(400).json({ 
        error: 'Invalid test type', 
        validTypes: validTestTypes 
      });
    }

    let result = {};

    switch (testType) {
      case 'collision':
        result = await performCollisionTest(sampleSize, fingerprintType);
        break;
      case 'comparison':
        result = await performHashComparison(sampleSize);
        break;
      case 'information-loss':
        result = await performInformationLossTest(sampleSize);
        break;
      case 'distribution':
        result = await performDistributionAnalysis(sampleSize);
        break;
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Test for collisions in BBID fingerprints
async function performCollisionTest(sampleSize, fingerprintType) {
  // Connect to MongoDB to get real device data if available
  const uri = process.env.MONGODB_URI;
  let client;
  let realDeviceData = [];
  
  try {
    if (uri) {
      client = new MongoClient(uri);
      await client.connect();
      const database = client.db('bbid');
      const devices = database.collection('devices');
      
      // Get real device data
      realDeviceData = await devices.find({}).limit(parseInt(sampleSize)).toArray();
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }

  // Generate synthetic data if we don't have enough real data
  const syntheticData = [];
  const neededSamples = Math.max(0, sampleSize - realDeviceData.length);
  
  for (let i = 0; i < neededSamples; i++) {
    syntheticData.push(generateSyntheticFingerprint(fingerprintType));
  }
  
  // Combine real and synthetic data
  const allData = [...realDeviceData.map(d => d.fingerprint || d.traditionalFingerprint), ...syntheticData];
  
  // Generate BBIDs for all fingerprints
  const bbids = allData.map(fp => {
    const bbid = convertToBBID(fp);
    return bbid;
  });
  
  // Check for collisions
  const uniqueBBIDs = new Set(bbids);
  const collisionRate = 1 - (uniqueBBIDs.size / bbids.length);
  
  // Generate traditional hashes for comparison
  const sha256Hashes = allData.map(fp => crypto.createHash('sha256').update(fp).digest('hex'));
  const uniqueSHA256 = new Set(sha256Hashes);
  const sha256CollisionRate = 1 - (uniqueSHA256.size / sha256Hashes.length);
  
  const md5Hashes = allData.map(fp => crypto.createHash('md5').update(fp).digest('hex'));
  const uniqueMD5 = new Set(md5Hashes);
  const md5CollisionRate = 1 - (uniqueMD5.size / md5Hashes.length);
  
  return {
    testType: 'collision',
    sampleSize: allData.length,
    realSamples: realDeviceData.length,
    syntheticSamples: syntheticData.length,
    results: {
      bbid: {
        uniqueCount: uniqueBBIDs.size,
        collisionRate: collisionRate,
        collisionPercentage: (collisionRate * 100).toFixed(2) + '%'
      },
      sha256: {
        uniqueCount: uniqueSHA256.size,
        collisionRate: sha256CollisionRate,
        collisionPercentage: (sha256CollisionRate * 100).toFixed(2) + '%'
      },
      md5: {
        uniqueCount: uniqueMD5.size,
        collisionRate: md5CollisionRate,
        collisionPercentage: (md5CollisionRate * 100).toFixed(2) + '%'
      }
    }
  };
}

// Compare BBID against different hash functions
async function performHashComparison(sampleSize) {
  // Generate test data
  const testData = [];
  for (let i = 0; i < sampleSize; i++) {
    testData.push(generateSyntheticFingerprint());
  }
  
  // Calculate metrics for different hash functions
  const results = {
    bbid: {
      averageLength: 0,
      compressionRatio: 0,
      semanticEfficiency: 0,
      processingTime: 0
    },
    sha256: {
      averageLength: 0,
      compressionRatio: 0,
      semanticEfficiency: 0,
      processingTime: 0
    },
    sha512: {
      averageLength: 0,
      compressionRatio: 0,
      semanticEfficiency: 0,
      processingTime: 0
    },
    md5: {
      averageLength: 0,
      compressionRatio: 0,
      semanticEfficiency: 0,
      processingTime: 0
    },
    blake2: {
      averageLength: 0,
      compressionRatio: 0,
      semanticEfficiency: 0,
      processingTime: 0
    }
  };
  
  // Process each test data item
  for (const data of testData) {
    // BBID
    const bbidStart = performance.now();
    const bbid = convertToBBID(data);
    const bbidEnd = performance.now();
    const bbidMetrics = calculateMetrics(data, bbid);
    
    results.bbid.averageLength += bbid.length;
    results.bbid.compressionRatio += bbidMetrics.compressionRatio;
    results.bbid.semanticEfficiency += bbidMetrics.semanticEfficiency;
    results.bbid.processingTime += (bbidEnd - bbidStart);
    
    // SHA-256
    const sha256Start = performance.now();
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    const sha256End = performance.now();
    
    results.sha256.averageLength += sha256.length;
    results.sha256.compressionRatio += data.length / sha256.length;
    results.sha256.semanticEfficiency += 0; // No semantic meaning in SHA-256
    results.sha256.processingTime += (sha256End - sha256Start);
    
    // SHA-512
    const sha512Start = performance.now();
    const sha512 = crypto.createHash('sha512').update(data).digest('hex');
    const sha512End = performance.now();
    
    results.sha512.averageLength += sha512.length;
    results.sha512.compressionRatio += data.length / sha512.length;
    results.sha512.semanticEfficiency += 0; // No semantic meaning in SHA-512
    results.sha512.processingTime += (sha512End - sha512Start);
    
    // MD5
    const md5Start = performance.now();
    const md5 = crypto.createHash('md5').update(data).digest('hex');
    const md5End = performance.now();
    
    results.md5.averageLength += md5.length;
    results.md5.compressionRatio += data.length / md5.length;
    results.md5.semanticEfficiency += 0; // No semantic meaning in MD5
    results.md5.processingTime += (md5End - md5Start);
    
    // BLAKE2 (using blake2b-512)
    const blake2Start = performance.now();
    const blake2 = crypto.createHash('blake2b512').update(data).digest('hex');
    const blake2End = performance.now();
    
    results.blake2.averageLength += blake2.length;
    results.blake2.compressionRatio += data.length / blake2.length;
    results.blake2.semanticEfficiency += 0; // No semantic meaning in BLAKE2
    results.blake2.processingTime += (blake2End - blake2Start);
  }
  
  // Calculate averages
  for (const [key, value] of Object.entries(results)) {
    value.averageLength = value.averageLength / sampleSize;
    value.compressionRatio = value.compressionRatio / sampleSize;
    value.semanticEfficiency = value.semanticEfficiency / sampleSize;
    value.processingTime = value.processingTime / sampleSize;
  }
  
  return {
    testType: 'comparison',
    sampleSize,
    results
  };
}

// Test for information loss
async function performInformationLossTest(sampleSize) {
  // Generate pairs of similar fingerprints
  const pairs = [];
  for (let i = 0; i < sampleSize; i++) {
    const base = generateSyntheticFingerprint();
    const similar = createSimilarFingerprint(base);
    pairs.push({ base, similar });
  }
  
  // Results for different methods
  const results = {
    bbid: {
      differentiationRate: 0,
      averageSimilarity: 0
    },
    sha256: {
      differentiationRate: 0,
      averageSimilarity: 0
    },
    md5: {
      differentiationRate: 0,
      averageSimilarity: 0
    }
  };
  
  // Process each pair
  for (const { base, similar } of pairs) {
    // BBID
    const baseBBID = convertToBBID(base);
    const similarBBID = convertToBBID(similar);
    const bbidDifferent = baseBBID !== similarBBID;
    const bbidSimilarity = calculateSimilarity(baseBBID, similarBBID);
    
    results.bbid.differentiationRate += bbidDifferent ? 1 : 0;
    results.bbid.averageSimilarity += bbidSimilarity;
    
    // SHA-256
    const baseSHA256 = crypto.createHash('sha256').update(base).digest('hex');
    const similarSHA256 = crypto.createHash('sha256').update(similar).digest('hex');
    const sha256Different = baseSHA256 !== similarSHA256;
    const sha256Similarity = calculateSimilarity(baseSHA256, similarSHA256);
    
    results.sha256.differentiationRate += sha256Different ? 1 : 0;
    results.sha256.averageSimilarity += sha256Similarity;
    
    // MD5
    const baseMD5 = crypto.createHash('md5').update(base).digest('hex');
    const similarMD5 = crypto.createHash('md5').update(similar).digest('hex');
    const md5Different = baseMD5 !== similarMD5;
    const md5Similarity = calculateSimilarity(baseMD5, similarMD5);
    
    results.md5.differentiationRate += md5Different ? 1 : 0;
    results.md5.averageSimilarity += md5Similarity;
  }
  
  // Calculate averages
  for (const [key, value] of Object.entries(results)) {
    value.differentiationRate = value.differentiationRate / sampleSize;
    value.averageSimilarity = value.averageSimilarity / sampleSize;
  }
  
  return {
    testType: 'information-loss',
    sampleSize,
    results
  };
}

// Analyze distribution of fingerprints
async function performDistributionAnalysis(sampleSize) {
  // Connect to MongoDB to get real device data if available
  const uri = process.env.MONGODB_URI;
  let client;
  let realDeviceData = [];
  
  try {
    if (uri) {
      client = new MongoClient(uri);
      await client.connect();
      const database = client.db('bbid');
      const devices = database.collection('devices');
      
      // Get real device data
      realDeviceData = await devices.find({}).limit(parseInt(sampleSize)).toArray();
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
  
  // Generate synthetic data if we don't have enough real data
  const syntheticData = [];
  const neededSamples = Math.max(0, sampleSize - realDeviceData.length);
  
  for (let i = 0; i < neededSamples; i++) {
    syntheticData.push(generateSyntheticFingerprint());
  }
  
  // Combine real and synthetic data
  const allData = [...realDeviceData.map(d => d.fingerprint || d.traditionalFingerprint), ...syntheticData];
  
  // Generate fingerprints using different methods
  const bbids = allData.map(fp => convertToBBID(fp));
  const sha256Hashes = allData.map(fp => crypto.createHash('sha256').update(fp).digest('hex'));
  const md5Hashes = allData.map(fp => crypto.createHash('md5').update(fp).digest('hex'));
  
  // Analyze character distribution
  const bbidDistribution = analyzeCharacterDistribution(bbids);
  const sha256Distribution = analyzeCharacterDistribution(sha256Hashes);
  const md5Distribution = analyzeCharacterDistribution(md5Hashes);
  
  // Analyze entropy
  const bbidEntropy = calculateEntropy(bbids);
  const sha256Entropy = calculateEntropy(sha256Hashes);
  const md5Entropy = calculateEntropy(md5Hashes);
  
  return {
    testType: 'distribution',
    sampleSize: allData.length,
    realSamples: realDeviceData.length,
    syntheticSamples: syntheticData.length,
    results: {
      bbid: {
        characterDistribution: bbidDistribution,
        entropy: bbidEntropy,
        averageLength: bbids.reduce((sum, bbid) => sum + bbid.length, 0) / bbids.length
      },
      sha256: {
        characterDistribution: sha256Distribution,
        entropy: sha256Entropy,
        averageLength: sha256Hashes.reduce((sum, hash) => sum + hash.length, 0) / sha256Hashes.length
      },
      md5: {
        characterDistribution: md5Distribution,
        entropy: md5Entropy,
        averageLength: md5Hashes.reduce((sum, hash) => sum + hash.length, 0) / md5Hashes.length
      }
    }
  };
}

// Helper functions

// Generate a synthetic fingerprint
function generateSyntheticFingerprint(type = 'uuid') {
  switch (type) {
    case 'uuid':
      return crypto.randomUUID();
    case 'canvas':
      return `canvas_fp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    case 'ip-hash':
      const randomIP = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      return crypto.createHash('sha256').update(randomIP).digest('hex');
    default:
      return crypto.randomBytes(32).toString('hex');
  }
}

// Create a similar fingerprint with small variations
function createSimilarFingerprint(base) {
  // For UUIDs, change a few characters
  if (base.includes('-')) {
    const parts = base.split('-');
    // Modify one section slightly
    const randomIndex = Math.floor(Math.random() * parts.length);
    const chars = parts[randomIndex].split('');
    // Change 1-2 characters
    for (let i = 0; i < Math.min(2, chars.length); i++) {
      const pos = Math.floor(Math.random() * chars.length);
      chars[pos] = Math.floor(Math.random() * 16).toString(16);
    }
    parts[randomIndex] = chars.join('');
    return parts.join('-');
  } else {
    // For other types, change a few random characters
    const chars = base.split('');
    const numChanges = Math.max(1, Math.floor(chars.length * 0.05)); // Change up to 5%
    
    for (let i = 0; i < numChanges; i++) {
      const pos = Math.floor(Math.random() * chars.length);
      if ('0123456789abcdef'.includes(chars[pos])) {
        chars[pos] = Math.floor(Math.random() * 16).toString(16);
      } else {
        // If not a hex character, just change it to something similar
        chars[pos] = String.fromCharCode(chars[pos].charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
      }
    }
    
    return chars.join('');
  }
}

// Calculate similarity between two strings (0-1)
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  let matches = 0;
  
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) {
      matches++;
    }
  }
  
  return matches / maxLength;
}

// Analyze character distribution in a set of strings
function analyzeCharacterDistribution(strings) {
  const distribution = {};
  let totalChars = 0;
  
  for (const str of strings) {
    for (const char of str) {
      if (!distribution[char]) {
        distribution[char] = 0;
      }
      distribution[char]++;
      totalChars++;
    }
  }
  
  // Convert to percentages
  for (const [char, count] of Object.entries(distribution)) {
    distribution[char] = count / totalChars;
  }
  
  return distribution;
}

// Calculate Shannon entropy of a set of strings
function calculateEntropy(strings) {
  const charCounts = {};
  let totalChars = 0;
  
  // Count occurrences of each character
  for (const str of strings) {
    for (const char of str) {
      if (!charCounts[char]) {
        charCounts[char] = 0;
      }
      charCounts[char]++;
      totalChars++;
    }
  }
  
  // Calculate entropy
  let entropy = 0;
  for (const count of Object.values(charCounts)) {
    const probability = count / totalChars;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}
