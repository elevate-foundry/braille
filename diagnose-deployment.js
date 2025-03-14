// Script to diagnose the deployment and MongoDB connection issues
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

async function diagnoseDeployment() {
  console.log('Starting deployment diagnosis...');
  
  // 1. Check if the API endpoint is accessible
  try {
    console.log('\n1. Testing API endpoint accessibility...');
    const response = await fetch('https://braillebuddy.vercel.app/api/test-mongo');
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      console.log('API response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ API endpoint is working correctly!');
      } else {
        console.log('❌ API endpoint returned success: false');
        console.log('Error details:', data.error || 'No error details provided');
      }
    } catch (jsonError) {
      console.log('❌ Failed to parse API response as JSON');
      console.log('Raw response:', responseText);
    }
  } catch (apiError) {
    console.log('❌ Failed to access API endpoint');
    console.log('Error:', apiError.message);
  }
  
  // 2. Test direct MongoDB connection
  try {
    console.log('\n2. Testing direct MongoDB connection...');
    const uri = 'mongodb+srv://ryanbarrett:FqGIrOXVyPRynEB0@braille.8iv6f.mongodb.net/bbid?retryWrites=true&w=majority';
    
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    // Access the database
    const bbidDb = client.db('bbid');
    console.log('Accessed bbid database');
    
    // Insert test document
    const testCollection = bbidDb.collection('connection_tests');
    const testDoc = {
      timestamp: new Date(),
      source: 'Deployment diagnosis script',
      environment: 'Local test'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted with ID:', insertResult.insertedId.toString());
    
    // Close connection
    await client.close();
    console.log('Connection closed successfully');
  } catch (mongoError) {
    console.log('❌ MongoDB connection error:');
    console.log('Error name:', mongoError.name);
    console.log('Error message:', mongoError.message);
    console.log('Error code:', mongoError.code);
  }
  
  // 3. Provide recommendations
  console.log('\n3. Recommendations:');
  console.log('- Check if the MongoDB connection string in vercel.json is correct');
  console.log('- Verify that the MongoDB Atlas database is accessible from Vercel');
  console.log('- Check if there are any IP restrictions on the MongoDB Atlas cluster');
  console.log('- Review Vercel logs for any deployment or runtime errors');
  console.log('- Consider creating a new MongoDB user specifically for this application');
}

// Run the diagnosis
diagnoseDeployment()
  .then(() => {
    console.log('\nDiagnosis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error during diagnosis:', error);
    process.exit(1);
  });
