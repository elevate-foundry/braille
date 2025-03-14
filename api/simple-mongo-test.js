// Simple MongoDB Connection Test API Endpoint
const { MongoClient } = require('mongodb');
const os = require('os');

// Helper function to get environment information
function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    },
    memoryUsage: process.memoryUsage(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime()
  };
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Use the MongoDB URI from environment variables or fallback to hardcoded URI
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ryanbarrett:FqGIrOXVyPRynEB0@braille.8iv6f.mongodb.net/bbid?retryWrites=true&w=majority';
  
  try {
    // Get environment information for debugging
    const envInfo = getEnvironmentInfo();
    console.log('Environment info:', JSON.stringify(envInfo));
    
    // Redact the password from the URI for logging
    const redactedUri = uri.replace(/:[^:@]*@/, ':***@');
    console.log('Simple MongoDB test: Using connection string:', redactedUri);
    
    console.log('Simple MongoDB test: Creating client...');
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000, // Increase timeout for serverless environment
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 1, // Limit pool size for serverless
      minPoolSize: 0
    });
    
    console.log('Simple MongoDB test: Connecting...');
    await client.connect();
    console.log('Simple MongoDB test: Connected successfully!');
    
    // Access the database
    const db = client.db('bbid');
    
    // Insert a test document
    const collection = db.collection('connection_tests');
    const testDoc = {
      timestamp: new Date(),
      source: 'Simple API test',
      userAgent: req.headers['user-agent'] || 'unknown'
    };
    
    const result = await collection.insertOne(testDoc);
    console.log('Simple MongoDB test: Document inserted with ID:', result.insertedId.toString());
    
    // Close the connection
    await client.close();
    console.log('Simple MongoDB test: Connection closed');
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'MongoDB connection successful',
      documentId: result.insertedId.toString(),
      timestamp: new Date().toISOString(),
      environment: getEnvironmentInfo()
    });
  } catch (error) {
    console.error('Simple MongoDB test error:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      environment: getEnvironmentInfo()
    });
  }
};
