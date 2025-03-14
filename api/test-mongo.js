// Test MongoDB Connection API Endpoint
const { MongoClient } = require('mongodb');

// Create a cached connection variable
let cachedClient = null;
let cachedDb = null;

// Function to connect to MongoDB
async function connectToDatabase(uri) {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  
  // If no connection, create a new one
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    const db = client.db('bbid');
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return environment info without attempting connection
  const envInfo = {
    nodeEnv: process.env.NODE_ENV || 'not set',
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    region: process.env.VERCEL_REGION || 'not set',
    allEnvVars: Object.keys(process.env).filter(key => 
      !key.toLowerCase().includes('password') && 
      !key.toLowerCase().includes('secret') &&
      !key.toLowerCase().includes('token')
    )
  };

  // Use a hardcoded connection string for testing
  // This is just for diagnostic purposes
  const hardcodedUri = 'mongodb+srv://ryanbarrett:FqGIrOXVyPRynEB0@braille.8iv6f.mongodb.net/bbid?retryWrites=true&w=majority';
  
  // Log the environment variables for debugging
  console.log('Environment info:', {
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    region: process.env.VERCEL_REGION || 'not set'
  });

  try {
    // Try connecting with the environment variable first
    let connection = null;
    let connectionSource = '';
    let connectionError = null;
    
    try {
      if (process.env.MONGODB_URI) {
        connectionSource = 'environment variable';
        console.log('Attempting connection with environment variable');
        connection = await connectToDatabase(process.env.MONGODB_URI);
        console.log('Connected successfully with environment variable');
      }
    } catch (envError) {
      console.error('Failed to connect with environment variable:', {
        name: envError.name,
        message: envError.message,
        code: envError.code
      });
      connectionError = envError;
      
      // If that fails, try the hardcoded URI
      try {
        connectionSource = 'hardcoded string';
        console.log('Attempting connection with hardcoded string');
        connection = await connectToDatabase(hardcodedUri);
        console.log('Connected successfully with hardcoded string');
      } catch (hardcodedError) {
        console.error('Failed to connect with hardcoded string:', {
          name: hardcodedError.name,
          message: hardcodedError.message,
          code: hardcodedError.code
        });
        throw hardcodedError; // Re-throw to be caught by the outer catch
      }
    }

    if (!connection) {
      throw new Error('No MongoDB connection available');
    }
    
    // Successfully connected - gather info
    const dbInfo = {};
    
    try {
      // Access the bbid database from our connection
      const { client, db } = connection;
      dbInfo.databaseAccessed = 'bbid';
      
      // Insert test document
      const testCollection = db.collection('connection_tests');
      const testDoc = {
        timestamp: new Date(),
        source: 'API test endpoint',
        connectionSource,
        userAgent: req.headers['user-agent'] || 'unknown'
      };
      
      const insertResult = await testCollection.insertOne(testDoc);
      dbInfo.testInsertId = insertResult.insertedId?.toString();
      
      // Note: We don't close the connection when using connection pooling
      // This allows for better performance in serverless environments
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      dbInfo.error = dbError.message;
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: `MongoDB connection successful using ${connectionSource}`,
      environmentInfo: envInfo,
      databaseInfo: dbInfo,
      connectionSource
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Return detailed error response
    return res.status(500).json({
      success: false,
      error: 'MongoDB connection failed',
      message: error.message,
      environmentInfo: envInfo,
      errorDetails: {
        name: error.name,
        code: error.code,
        codeName: error.codeName,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};
