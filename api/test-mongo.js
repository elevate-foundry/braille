// Test MongoDB Connection API Endpoint
const { MongoClient } = require('mongodb');

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
    nodeEnv: process.env.NODE_ENV
  });

  try {
    // Try connecting with the environment variable first
    let client = null;
    let connectionSource = '';
    let connectionError = null;
    
    try {
      if (process.env.MONGODB_URI) {
        connectionSource = 'environment variable';
        client = new MongoClient(process.env.MONGODB_URI, { 
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        await client.connect();
      }
    } catch (envError) {
      console.error('Failed to connect with environment variable:', envError);
      connectionError = envError;
      
      // If that fails, try the hardcoded URI
      try {
        connectionSource = 'hardcoded string';
        console.log('Attempting connection with hardcoded string');
        client = new MongoClient(hardcodedUri, { 
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        
        // Log the connection attempt
        console.log('Before client.connect() call');
        await client.connect();
        console.log('After client.connect() call - Connection successful');
      } catch (hardcodedError) {
        console.error('Failed to connect with hardcoded string:', {
          name: hardcodedError.name,
          message: hardcodedError.message,
          code: hardcodedError.code,
          stack: hardcodedError.stack
        });
        throw hardcodedError; // Re-throw to be caught by the outer catch
      }
    }

    if (!client) {
      throw new Error('No MongoDB client available');
    }
    
    // Successfully connected - gather info
    const dbInfo = {};
    
    try {
      // Get list of databases
      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases({ nameOnly: true });
      dbInfo.allDatabases = databasesList.databases.map(db => db.name);
      
      // Check for bbid database
      const bbidDb = client.db('bbid');
      const collections = await bbidDb.listCollections().toArray();
      dbInfo.bbidCollections = collections.map(c => c.name);
      
      // Insert test document
      const testCollection = bbidDb.collection('connection_tests');
      const testDoc = {
        timestamp: new Date(),
        source: 'API test endpoint',
        connectionSource,
        userAgent: req.headers['user-agent'] || 'unknown'
      };
      
      const insertResult = await testCollection.insertOne(testDoc);
      dbInfo.testInsertId = insertResult.insertedId?.toString();
    } catch (dbError) {
      dbInfo.error = dbError.message;
    }
    
    // Close connection
    await client.close();
    
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
