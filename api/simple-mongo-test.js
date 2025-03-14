// Simple MongoDB Connection Test API Endpoint
const { MongoClient } = require('mongodb');

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
    console.log('Simple MongoDB test: Creating client...');
    const client = new MongoClient(uri);
    
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
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });
  }
};
