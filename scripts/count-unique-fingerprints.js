// Script to count unique fingerprints in the BBID database
const { MongoClient } = require('mongodb');

// MongoDB connection string - using environment variable
const uri = process.env.MONGODB_URI;

async function countUniqueFingerprints() {
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('bbid-analytics');
    const devices = database.collection('devices');
    
    // Count total documents
    const totalCount = await devices.countDocuments();
    console.log(`Total device records: ${totalCount}`);
    
    // Count unique fingerprints
    const uniqueFingerprints = await devices.distinct('fingerprint');
    console.log(`Unique device fingerprints: ${uniqueFingerprints.length}`);
    
    // Count unique BBIDs
    const uniqueBBIDs = await devices.distinct('bbid');
    console.log(`Unique BBIDs: ${uniqueBBIDs.length}`);
    
    // Count unique IP hashes
    const uniqueIPs = await devices.distinct('ipHash');
    console.log(`Unique IP addresses (hashed): ${uniqueIPs.length}`);
    
    // Get most recent visits
    const recentVisits = await devices.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .project({ timestamp: 1, userAgent: 1, _id: 0 })
      .toArray();
    
    console.log('\nMost recent visits:');
    recentVisits.forEach(visit => {
      console.log(`${visit.timestamp} - ${visit.userAgent.substring(0, 50)}...`);
    });
    
    // Get behavioral fingerprints if they exist
    const behavioralCount = await devices.countDocuments({ 'metrics.behavioralFingerprint': { $exists: true } });
    console.log(`\nRecords with behavioral fingerprints: ${behavioralCount}`);
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
countUniqueFingerprints();
