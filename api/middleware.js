// API Middleware for logging and request handling
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Log all API requests to MongoDB
async function logApiRequest(req, res, next) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not configured, skipping API request logging');
    return next ? next() : null;
  }

  try {
    // Extract request information
    const timestamp = new Date();
    const endpoint = req.url;
    const method = req.method;
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               'unknown';
    
    // Hash the IP for privacy
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');
    
    // Extract user agent and other headers
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers['referer'] || 'direct';
    const origin = req.headers['origin'] || 'unknown';
    
    // Prepare log entry
    const logEntry = {
      timestamp,
      endpoint,
      method,
      hashedIp,
      userAgent,
      referer,
      origin,
      headers: sanitizeHeaders(req.headers),
      query: req.query || {},
      body: sanitizeBody(req.body)
    };

    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db('bbid');
    const apiLogs = database.collection('api_logs');
    
    // Insert log entry
    await apiLogs.insertOne(logEntry);
    await client.close();
  } catch (error) {
    console.error('Error logging API request:', error);
  }
  
  // Continue with request processing
  return next ? next() : null;
}

// Sanitize headers to remove sensitive information
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  
  // Remove potentially sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-auth-token'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Sanitize request body to remove sensitive information
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove potentially sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'credentials'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

module.exports = {
  logApiRequest
};
