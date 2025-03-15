/**
 * Custom Fingerprinting API Endpoint
 * 
 * This API endpoint uses our custom fingerprinting solution instead of Fingerprint.js Pro.
 * It creates a unique identifier for users without collecting personally identifiable information.
 */

// Using a simplified approach without framework-specific types
// This makes the API compatible with both Express and Vercel
interface Request {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface Response {
  status: (code: number) => Response;
  json: (data: any) => void;
}
import dbConnect from '../src/lib/db.js';
import Fingerprint from '../src/models/Fingerprint.js';
import ConsentModel from '../src/models/Consent.js';
import { getFingerprint } from '../src/lib/customFingerprint.js';

export default async function handler(req: Request, res: Response) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await dbConnect();
    
    // Get browser details from user agent
    const userAgent = req.headers?.['user-agent'] || '';
    // Ensure we're working with a string
    const userAgentString = Array.isArray(userAgent) ? userAgent[0] : userAgent;
    const browserDetails = parseBrowserDetails(userAgentString);
    
    // Get session data from request body
    const { 
      sessionDuration = 0,
      lessonCompleted = false,
      hapticFeedbackEnabled = false,
      learningData = {},
      visitorId = null // The fingerprint should be sent from the client
    } = req.body || {};
    
    // If no visitorId is provided, generate one server-side as a fallback
    // This is less accurate than client-side fingerprinting but works as a fallback
    const fingerprintId = visitorId || await generateFingerprint(userAgentString);
    
    // Find or create fingerprint record
    let fingerprintRecord = await Fingerprint.findOne({ visitorId: fingerprintId });
    
    if (!fingerprintRecord) {
      // Create new record if not found
      fingerprintRecord = new Fingerprint({
        visitorId: fingerprintId,
        learningProgress: {
          level: 1,
          completedLessons: [],
          accuracy: 0,
          lastActivity: new Date(),
          achievements: []
        },
        visits: []
      });
    }
    
    // Update learning progress if provided
    if (learningData.level) {
      fingerprintRecord.learningProgress.level = learningData.level;
    }
    
    if (learningData.completedLessons) {
      // Add any new completed lessons without duplicates
      const newLessons = learningData.completedLessons.filter(
        (lesson: string) => !fingerprintRecord.learningProgress.completedLessons.includes(lesson)
      );
      
      fingerprintRecord.learningProgress.completedLessons = [
        ...fingerprintRecord.learningProgress.completedLessons,
        ...newLessons
      ];
    }
    
    if (learningData.accuracy) {
      fingerprintRecord.learningProgress.accuracy = learningData.accuracy;
    }
    
    if (learningData.achievements) {
      // Add any new achievements without duplicates
      const newAchievements = learningData.achievements.filter(
        (achievement: string) => !fingerprintRecord.learningProgress.achievements.includes(achievement)
      );
      
      fingerprintRecord.learningProgress.achievements = [
        ...fingerprintRecord.learningProgress.achievements,
        ...newAchievements
      ];
    }
    
    // Update last activity
    fingerprintRecord.learningProgress.lastActivity = new Date();
    
    // Add visit record
    fingerprintRecord.visits.push({
      timestamp: new Date(),
      browserDetails,
      sessionDuration,
      lessonCompleted,
      hapticFeedbackEnabled
    });
    
    // Save the record
    await fingerprintRecord.save();
    
    // Get consent status from database
    const consentRecord = await ConsentModel.findOne({ visitorId: fingerprintId });
    const hasConsent = consentRecord?.consented || false;
    
    // Generate fingerprint components for display
    const components = generateFingerprintComponents(userAgentString, fingerprintId);
    
    // Return the fingerprint data
    return res.status(200).json({
      visitorId: fingerprintId,
      learningProgress: fingerprintRecord.learningProgress,
      visits: fingerprintRecord.visits,
      firstSeen: fingerprintRecord.visits[0]?.timestamp || new Date(),
      lastSeen: new Date(),
      components,
      hasConsent,
      consentTimestamp: consentRecord?.timestamp || null,
      success: true
    });
    
  } catch (error) {
    console.error('Error in custom fingerprint API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate fingerprint components for display
 * This creates a detailed breakdown of the fingerprint for educational purposes
 */
function generateFingerprintComponents(userAgent: string, fingerprintId: string) {
  const browserDetails = parseBrowserDetails(userAgent);
  
  // Create a structured object of fingerprint components
  // This is educational and helps users understand what makes their fingerprint unique
  return {
    // Basic browser information
    browser: {
      name: browserDetails.browserName,
      version: browserDetails.browserVersion,
      userAgent: userAgent.substring(0, 100) + '...' // Truncated for display
    },
    
    // Operating system information
    operatingSystem: {
      name: browserDetails.os,
      version: browserDetails.osVersion
    },
    
    // Screen and window information
    screen: {
      // These would normally come from the client, using placeholder values
      colorDepth: '24-bit',
      resolution: '1920x1080',
      availableResolution: '1920x1040'
    },
    
    // Hardware information (simulated for educational purposes)
    hardware: {
      deviceMemory: '8GB',
      processorCores: 4,
      touchSupport: true,
      hapticFeedback: true
    },
    
    // Braille-specific components
    brailleSettings: {
      preferredCellSize: 'standard',
      contrastMode: 'high',
      hapticIntensity: 'medium',
      learningLevel: 'beginner'
    },
    
    // Fingerprint ID components (educational breakdown)
    fingerprintBreakdown: {
      // Show how the fingerprint is constructed (simplified for education)
      hashAlgorithm: 'SHA-256',
      uniqueComponents: 12,
      stabilityScore: '98%',
      fingerprintId: fingerprintId
    }
  };
}

/**
 * Parse browser details from user agent string
 */
function parseBrowserDetails(userAgent: string) {
  // Simple user agent parsing - in production, use a more robust solution
  const browserDetails = {
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    os: 'Unknown',
    osVersion: 'Unknown'
  };
  
  // Extract browser name and version
  if (userAgent.includes('Chrome')) {
    browserDetails.browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) {
      browserDetails.browserVersion = match[1];
    }
  } else if (userAgent.includes('Firefox')) {
    browserDetails.browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) {
      browserDetails.browserVersion = match[1];
    }
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserDetails.browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) {
      browserDetails.browserVersion = match[1];
    }
  } else if (userAgent.includes('Edge')) {
    browserDetails.browserName = 'Edge';
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    if (match) {
      browserDetails.browserVersion = match[1];
    }
  }
  
  // Extract OS name and version
  if (userAgent.includes('Windows')) {
    browserDetails.os = 'Windows';
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      browserDetails.osVersion = match[1];
    }
  } else if (userAgent.includes('Mac OS X')) {
    browserDetails.os = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      browserDetails.osVersion = match[1].replace('_', '.');
    }
  } else if (userAgent.includes('Linux')) {
    browserDetails.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    browserDetails.os = 'Android';
    const match = userAgent.match(/Android (\d+\.\d+)/);
    if (match) {
      browserDetails.osVersion = match[1];
    }
  } else if (userAgent.includes('iOS')) {
    browserDetails.os = 'iOS';
    const match = userAgent.match(/OS (\d+_\d+)/);
    if (match) {
      browserDetails.osVersion = match[1].replace('_', '.');
    }
  }
  
  return browserDetails;
}

/**
 * Generate a fingerprint from user agent
 * This is a simplified version - in production, use the full customFingerprint.ts implementation
 */
async function generateFingerprint(userAgent: string): Promise<string> {
  try {
    // In a real implementation, we would use the getFingerprint() function
    // from our customFingerprint.ts file, but for server-side simulation,
    // we'll create a hash of the user agent
    // Import CryptoJS dynamically for server-side usage
    const CryptoJS = require('crypto-js');
    // Create SHA-256 hash of the user agent and current timestamp
    const hashOutput = CryptoJS.SHA256(userAgent + Date.now().toString());
    return hashOutput.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    // Fallback to a random ID if hashing fails
    return Math.random().toString(36).substring(2, 15);
  }
}
