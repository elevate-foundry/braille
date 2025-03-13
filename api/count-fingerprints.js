const { setCorsHeaders } = require('./utils');
const { MongoClient } = require('mongodb');

// MongoDB connection string - will be set as an environment variable in Vercel
const uri = process.env.MONGODB_URI;

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    
    const database = client.db('bbid-analytics');
    const devices = database.collection('devices');
    
    // Count total documents
    const totalCount = await devices.countDocuments();
    
    // Count unique fingerprints
    const uniqueFingerprints = await devices.distinct('fingerprint');
    
    // Count unique BBIDs
    const uniqueBBIDs = await devices.distinct('bbid');
    
    // Count unique IP hashes
    const uniqueIPs = await devices.distinct('ipHash');
    
    // Get most recent visits (limit to 5)
    const recentVisits = await devices.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .project({ timestamp: 1, userAgent: 1, _id: 0 })
      .toArray();
    
    // Get behavioral fingerprints count if they exist
    const behavioralCount = await devices.countDocuments({ 'metrics.behavioralFingerprint': { $exists: true } });
    
    // Close the connection
    await client.close();
    
    // Return the statistics
    return res.status(200).json({
      totalRecords: totalCount,
      uniqueFingerprints: uniqueFingerprints.length,
      uniqueBBIDs: uniqueBBIDs.length,
      uniqueIPAddresses: uniqueIPs.length,
      behavioralFingerprints: behavioralCount,
      recentVisits: recentVisits
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching fingerprint statistics' });
  }
};
