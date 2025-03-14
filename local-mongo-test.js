// Simple script to test MongoDB connection locally
const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  // Use the same connection string as in vercel.json
  const uri = 'mongodb+srv://ryanbarrett:FqGIrOXVyPRynEB0@braille.8iv6f.mongodb.net/bbid?retryWrites=true&w=majority';
  
  console.log('Testing MongoDB connection...');
  
  try {
    console.log('Creating MongoDB client...');
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB!');
    
    // Skip database listing which was causing issues
    // Just directly access the bbid database
    const bbidDb = client.db('bbid');
    console.log('Accessed bbid database');
    
    // Insert test document
    const testCollection = bbidDb.collection('connection_tests');
    const testDoc = {
      timestamp: new Date(),
      source: 'Local test script',
      userAgent: 'Node.js script'
    };
    
    console.log('Inserting test document...');
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('Test document inserted with ID:', insertResult.insertedId.toString());
    
    // Close connection
    await client.close();
    console.log('Connection closed successfully');
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    return false;
  }
}

// Run the test
testMongoConnection()
  .then(success => {
    console.log('Test completed. Success:', success);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
