import { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/lib/db.js';
import Fingerprint from '../src/models/Fingerprint.js';

async function getVisitorData(visitorId: string) {
  try {
    const response = await fetch(`https://api.fpjs.io/visitors/${visitorId}`, {
      method: 'GET',
      headers: {
        'Auth-API-Key': process.env.FINGERPRINT_SECRET_KEY as string,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON response but got: ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getVisitorData:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { visitorId } = req.query;

  if (!visitorId || typeof visitorId !== 'string') {
    return res.status(400).json({ error: 'Visitor ID is required' });
  }

  try {
    // Connect to MongoDB
    await dbConnect();

    // Get data from FingerprintJS API
    const fpjsData = await getVisitorData(visitorId);

    // Find or create fingerprint record
    let fingerprint = await Fingerprint.findOne({ visitorId });
    
    if (!fingerprint) {
      fingerprint = new Fingerprint({ 
        visitorId,
        visits: []
      });
    }

    // Add new visit data
    const latestVisit = fpjsData.visits[0];
    fingerprint.visits.push({
      requestId: latestVisit.requestId,
      timestamp: latestVisit.timestamp,
      browserDetails: {
        browserName: latestVisit.browserDetails.browserName,
        browserVersion: latestVisit.browserDetails.browserVersion,
        os: latestVisit.browserDetails.os,
        osVersion: latestVisit.browserDetails.osVersion,
      },
      incognito: latestVisit.incognito,
      ip: latestVisit.ip,
      ipLocation: {
        country: latestVisit.ipLocation.country,
        city: latestVisit.ipLocation.city,
      },
    });

    // Save to MongoDB
    await fingerprint.save();

    res.status(200).json(fpjsData);
  } catch (error) {
    console.error('Error handling fingerprint data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to handle fingerprint data';
    res.status(500).json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}