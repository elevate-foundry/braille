const { setCorsHeaders } = require('./utils');
const { MongoClient } = require('mongodb');

// MongoDB connection string - will be set as an environment variable in Vercel
const uri = process.env.MONGODB_URI;

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { deviceInfo, fingerprint, bbid, metrics, timestamp = new Date().toISOString() } = req.body;
    
    if (!fingerprint || !bbid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Connect to MongoDB
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    
    // Insert device data
    const database = client.db('bbid-analytics');
    const devices = database.collection('devices');
    
    // Add IP address (hashed for privacy)
    const crypto = require('crypto');
    const ipHash = crypto.createHash('sha256')
      .update(req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown')
      .digest('hex');
    
    // Create document to insert
    const deviceDoc = {
      deviceInfo,
      fingerprint,
      bbid,
      metrics,
      timestamp,
      ipHash,
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    // Insert the document
    const result = await devices.insertOne(deviceDoc);
    
    // Close the connection
    await client.close();
    
    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Device logged successfully',
      deviceId: result.insertedId
    });
    
  } catch (error) {
    console.error('Error logging device:', error);
    return res.status(500).json({ error: 'Failed to log device data' });
  }
};
