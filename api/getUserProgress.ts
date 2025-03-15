/**
 * API Endpoint to retrieve user progress by fingerprint
 * Used to demonstrate how fingerprints can be used to track user data
 */

// Using a simplified approach without framework-specific types
// This makes the API compatible with different Next.js versions
type NextApiRequest = {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
};

type NextApiResponse = {
  status: (code: number) => NextApiResponse;
  json: (data: any) => void;
};
import dbConnect from '../src/lib/db.js';
import Fingerprint from '../src/models/Fingerprint.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await dbConnect();
    
    // Get visitorId from request body
    const { visitorId } = req.body;
    
    if (!visitorId) {
      return res.status(400).json({ error: 'Fingerprint ID is required' });
    }
    
    // Find fingerprint record
    const fingerprintRecord = await Fingerprint.findOne({ visitorId });
    
    if (!fingerprintRecord) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user progress data
    return res.status(200).json({
      visitorId: fingerprintRecord.visitorId,
      learningProgress: fingerprintRecord.learningProgress,
      visits: fingerprintRecord.visits
    });
    
  } catch (error) {
    console.error('Error retrieving user progress:', error);
    return res.status(500).json({ error: 'Failed to retrieve user progress' });
  }
}
