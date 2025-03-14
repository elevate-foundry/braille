// Identity Linking API
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { setCorsHeaders } = require('./utils');
const { logApiRequest } = require('./middleware');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Log this API request
  await logApiRequest(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle POST requests for linking identity
  if (req.method === 'POST' && !req.url.includes('/verify')) {
    try {
      // Parse request body
      const { 
        identifierHash,
        deviceId,
        timestamp,
        linkType
      } = req.body;

      // Validate required parameters
      if (!identifierHash || !deviceId) {
        return res.status(400).json({ 
          error: 'Missing required parameters', 
          message: 'Both identifierHash and deviceId are required' 
        });
      }

      // Create identity link object
      const identityLink = {
        identifierHash,
        deviceId,
        timestamp: timestamp || new Date().toISOString(),
        linkType: linkType || 'unknown',
        createdAt: new Date(),
        lastSeen: new Date()
      };

      // Generate a unique identity token
      const identityToken = generateIdentityToken(identifierHash, deviceId);
      identityLink.identityToken = identityToken;

      // Store in MongoDB if connection string is available
      const uri = process.env.MONGODB_URI;
      if (uri) {
        const client = new MongoClient(uri);
        await client.connect();
        const database = client.db('bbid');
        const identityCollection = database.collection('identity_links');
        
        // Check if this hash already exists
        const existingLink = await identityCollection.findOne({ identifierHash });
        
        if (existingLink) {
          // Update the existing link with new device ID and last seen
          await identityCollection.updateOne(
            { identifierHash },
            { 
              $set: { 
                lastSeen: new Date() 
              },
              $addToSet: { 
                linkedDevices: deviceId 
              }
            }
          );
          
          // Return the existing identity token
          await client.close();
          return res.status(200).json({
            success: true,
            message: 'Identity link updated',
            identityToken: existingLink.identityToken,
            isExisting: true
          });
        } else {
          // Create a new link
          identityLink.linkedDevices = [deviceId];
          
          await identityCollection.insertOne(identityLink);
          await client.close();
        }
      }

      // Return the results
      return res.status(200).json({
        success: true,
        message: 'Identity linked successfully',
        identityToken,
        isNew: true
      });
    } catch (error) {
      console.error('Identity linking error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
  
  // Handle POST requests for verifying identity
  if (req.method === 'POST' && req.url.includes('/verify')) {
    try {
      const { identityToken } = req.body;
      
      if (!identityToken) {
        return res.status(400).json({ 
          error: 'Missing required parameter', 
          message: 'Identity token is required' 
        });
      }
      
      // Check if the token exists in MongoDB
      const uri = process.env.MONGODB_URI;
      if (uri) {
        const client = new MongoClient(uri);
        await client.connect();
        const database = client.db('bbid');
        const identityCollection = database.collection('identity_links');
        
        const identityLink = await identityCollection.findOne({ identityToken });
        
        await client.close();
        
        if (identityLink) {
          // Return success with minimal information
          return res.status(200).json({
            success: true,
            verified: true,
            linkType: identityLink.linkType,
            linkedDevices: identityLink.linkedDevices.length
          });
        } else {
          return res.status(404).json({
            success: false,
            verified: false,
            message: 'Identity token not found'
          });
        }
      } else {
        // If no MongoDB connection, just return a generic success
        return res.status(200).json({
          success: true,
          verified: true,
          message: 'Identity verification simulated (no database connection)'
        });
      }
    } catch (error) {
      console.error('Identity verification error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }

  // Handle other HTTP methods
  return res.status(405).json({ error: 'Method not allowed' });
};

/**
 * Generate a unique identity token based on the identifier hash and device ID
 */
function generateIdentityToken(identifierHash, deviceId) {
  const data = identifierHash + '_' + deviceId + '_' + Date.now();
  return crypto.createHash('sha256').update(data).digest('hex');
}
