import React, { useEffect, useState, useRef } from 'react';

interface FingerprintData {
  visitorId: string;
  components?: Record<string, any>;
  timestamp?: string;
  sourceId?: string;
}

interface FingerprintWebSocketProps {
  currentFingerprint: string;
  onFingerprintUpdate?: (data: FingerprintData) => void;
}

const FingerprintWebSocket: React.FC<FingerprintWebSocketProps> = ({ 
  currentFingerprint,
  onFingerprintUpdate 
}) => {
  const [connected, setConnected] = useState(false);
  const [fingerprints, setFingerprints] = useState<FingerprintData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket server
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/fingerprint`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // Connection opened
    ws.addEventListener('open', () => {
      console.log('Connected to BBES WebSocket');
      setConnected(true);
      setError(null);
      
      // Send current fingerprint
      if (currentFingerprint) {
        ws.send(JSON.stringify({
          type: 'fingerprint',
          fingerprint: {
            visitorId: currentFingerprint
          }
        }));
      }
    });
    
    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'fingerprint' && data.fingerprint) {
          // Add to fingerprints list
          setFingerprints(prev => {
            // Avoid duplicates
            const exists = prev.some(fp => 
              fp.visitorId === data.fingerprint.visitorId && 
              fp.sourceId === data.sourceId
            );
            
            if (exists) {
              return prev.map(fp => 
                fp.visitorId === data.fingerprint.visitorId && fp.sourceId === data.sourceId
                  ? { ...fp, ...data.fingerprint, timestamp: data.timestamp }
                  : fp
              );
            } else {
              return [...prev, {
                ...data.fingerprint,
                timestamp: data.timestamp,
                sourceId: data.sourceId
              }];
            }
          });
          
          // Call update callback if provided
          if (onFingerprintUpdate) {
            onFingerprintUpdate(data.fingerprint);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Handle errors
    ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to BBES WebSocket server');
    });
    
    // Handle disconnection
    ws.addEventListener('close', () => {
      console.log('Disconnected from BBES WebSocket');
      setConnected(false);
    });
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentFingerprint]);
  
  // Send fingerprint update when it changes
  useEffect(() => {
    if (connected && wsRef.current && currentFingerprint) {
      wsRef.current.send(JSON.stringify({
        type: 'fingerprint',
        fingerprint: {
          visitorId: currentFingerprint
        }
      }));
    }
  }, [currentFingerprint, connected]);
  
  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <h2 className="text-xl font-semibold">
          BBES WebSocket {connected ? 'Connected' : 'Disconnected'}
        </h2>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {fingerprints.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium mb-4">Real-time Fingerprints ({fingerprints.length})</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {fingerprints.map((fp, index) => (
              <div key={`${fp.visitorId}-${fp.sourceId || index}`} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-sm break-all">
                    {fp.visitorId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fp.timestamp ? new Date(fp.timestamp).toLocaleTimeString() : 'Unknown time'}
                  </div>
                </div>
                {fp.sourceId && (
                  <div className="text-xs text-gray-500 mt-1">
                    Source: {fp.sourceId === 'server' ? 'Server-generated' : `Client ${fp.sourceId}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintWebSocket;
