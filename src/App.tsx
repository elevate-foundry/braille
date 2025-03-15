import React, { useEffect, useState } from 'react';
import { load } from '@fingerprintjs/fingerprintjs-pro';

interface FingerprintComponents {
  [key: string]: any;
}

interface VisitorData {
  visits: Array<{
    requestId: string;
    timestamp: string;
    browserDetails: {
      browserName: string;
      browserVersion: string;
      os: string;
      osVersion: string;
    };
    incognito: boolean;
    ip: string;
    ipLocation: {
      country: string;
      city: string;
    };
  }>;
}

function App() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await load({
          apiKey: 'b3ax42QACNcVSfbzxphE'
        });
        
        const result = await fp.get();
        setFingerprint(result.visitorId);
        
        // Fetch detailed visitor data from our API
        const response = await fetch(`/api/fingerprint?visitorId=${result.visitorId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch visitor data');
        }
        
        setVisitorData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to get fingerprint');
        setLoading(false);
      }
    };

    initFingerprint();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading fingerprint data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Browser Fingerprint Demo</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Fingerprint ID</h2>
          <div className="bg-gray-100 p-4 rounded-md font-mono break-all">
            {fingerprint}
          </div>
        </div>

        {visitorData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Visitor History</h2>
            <div className="space-y-6">
              {visitorData.visits.map((visit, index) => (
                <div key={visit.requestId} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 className="font-medium text-gray-700 mb-3">Visit {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Browser</p>
                      <p>{visit.browserDetails.browserName} {visit.browserDetails.browserVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Operating System</p>
                      <p>{visit.browserDetails.os} {visit.browserDetails.osVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{visit.ipLocation.city}, {visit.ipLocation.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IP Address</p>
                      <p>{visit.ip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Timestamp</p>
                      <p>{new Date(visit.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Incognito</p>
                      <p>{visit.incognito ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;