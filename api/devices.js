const { setCorsHeaders } = require('./utils');
const { MongoClient } = require('mongodb');

// MongoDB connection string - will be set as an environment variable in Vercel
const uri = process.env.MONGODB_URI;

// Simple API key authentication - will be set as an environment variable in Vercel
const API_KEY = process.env.ADMIN_API_KEY;

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check API key
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    
    // Get device data
    const database = client.db('bbid-analytics');
    const devices = database.collection('devices');
    
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    // Get devices with pagination
    const deviceList = await devices.find({})
      .sort({ timestamp: -1 }) // Most recent first
      .limit(limit)
      .skip(skip)
      .toArray();
    
    // Get total count
    const totalCount = await devices.countDocuments({});
    
    // Close the connection
    await client.close();
    
    // Return device data
    return res.status(200).json({
      devices: deviceList,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching devices:', error);
    return res.status(500).json({ error: 'Failed to fetch device data' });
  }
};
