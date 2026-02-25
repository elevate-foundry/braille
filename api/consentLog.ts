/**
 * Consent Logging API Endpoint
 * 
 * This API endpoint logs user consent events for the BBES fingerprinting system
 * and stores them in MongoDB for persistence across devices.
 */

// Using a simplified approach without framework-specific types
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
import ConsentModel from '../src/models/Consent.js';
import { getClientIp } from '../src/lib/utils.js';
import CryptoJS from 'crypto-js';

export default async function handler(req: Request, res: Response) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await dbConnect();
    
    const { 
      status, 
      consented, // Support both formats for backward compatibility
      timestamp = new Date().toISOString(), 
      userAgent, 
      visitorId,
      consentVersion = '1.0',
      consentContext = {}
    } = req.body || {};
    
    // Determine consent status (support multiple formats)
    let consentStatus: string | undefined = status;
    let consentBoolean: boolean;
    
    if (consented !== undefined) {
      // If consented is provided directly as boolean
      consentBoolean = !!consented;
      consentStatus = consentBoolean ? 'granted' : 'declined';
    } else if (consentStatus) {
      // If status is provided as string
      if (!['granted', 'declined'].includes(consentStatus)) {
        return res.status(400).json({ error: 'Invalid consent status' });
      }
      consentBoolean = consentStatus === 'granted';
    } else {
      return res.status(400).json({ error: 'Missing consent status' });
    }
    
    if (!visitorId) {
      return res.status(400).json({ error: 'Visitor ID is required' });
    }
    
    // Get client IP and hash it for privacy
    const clientIp = getClientIp(req);
    const ipHash = clientIp ? CryptoJS.SHA256(clientIp).toString() : undefined;
    
    // Create educational metadata for children
    const educationalMetadata = {
      ...consentContext,
      friendlyDescription: consentBoolean ? 
        "BrailleBuddy will remember what you've learned to help you practice" : 
        "BrailleBuddy won't save your progress, but you can still practice",
      dataUsage: "Your progress helps us make better braille lessons",
      privacyFriendly: true,
      lastUpdated: new Date(timestamp),
      hapticFeedbackEnabled: consentContext.hapticFeedbackEnabled || true
    };
    
    // Update or create consent record
    const now = new Date(timestamp);
    
    const consentRecord = await ConsentModel.findOneAndUpdate(
      { visitorId },
      {
        $set: {
          consented: consentBoolean,
          timestamp: now,
          userAgent,
          ipHash,
          consentVersion,
          educationalMetadata
        },
        $push: {
          consentHistory: {
            status: consentBoolean,
            timestamp: now,
            userAgent,
            context: consentContext
          }
        }
      },
      { upsert: true, new: true }
    );
    
    // Log consent event to console
    console.log(`[BBES Consent] Status: ${consentStatus}, Time: ${timestamp}, VisitorID: ${visitorId.substring(0, 8)}..., UA: ${userAgent || 'Unknown'}`);
    
    // Return success with child-friendly response
    return res.status(200).json({ 
      success: true,
      message: consentBoolean ? 
        "Thank you! BrailleBuddy will remember your progress to help you learn better." : 
        "That's okay! You can still practice braille, but BrailleBuddy won't remember your progress.",
      consented: consentBoolean,
      timestamp: now,
      visitorId,
      educationalInfo: {
        whatIsStored: "Your braille learning progress",
        howLong: "For 90 days",
        canChange: "You can change your mind anytime",
        hapticFeedback: "Feel a special pattern when you toggle consent"
      }
    });
  } catch (error) {
    console.error('Error in consent logging API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
