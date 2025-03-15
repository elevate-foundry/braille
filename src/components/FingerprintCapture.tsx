import { useEffect, useState } from 'react';
import { getFingerprint } from '../lib/customFingerprint.js';

interface FingerprintCaptureProps {
  onFingerprintCaptured?: (fingerprint: string) => void;
  autoCapture?: boolean;
}

/**
 * Component that captures browser fingerprints and stores them in MongoDB
 * Can be used invisibly or with a UI for user consent
 */
const FingerprintCapture: React.FC<FingerprintCaptureProps> = ({ 
  onFingerprintCaptured, 
  autoCapture = true 
}) => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optOut, setOptOut] = useState(false);

  // Check if user has opted out previously
  useEffect(() => {
    const userOptOut = localStorage.getItem('fingerprint_opt_out');
    if (userOptOut === 'true') {
      setOptOut(true);
    }
  }, []);

  // Capture fingerprint on component mount if autoCapture is true
  useEffect(() => {
    if (autoCapture && !optOut) {
      captureFingerprint();
    }
  }, [autoCapture, optOut]);

  // Function to capture and save fingerprint
  const captureFingerprint = async () => {
    if (optOut) return;
    
    try {
      setIsCapturing(true);
      setError(null);
      
      // Get fingerprint using our custom solution
      const visitorId = await getFingerprint();
      setFingerprint(visitorId);
      
      // Call the callback if provided
      if (onFingerprintCaptured) {
        onFingerprintCaptured(visitorId);
      }
      
      // Save fingerprint to MongoDB via our API
      await saveFingerprint(visitorId);
      
    } catch (err) {
      console.error('Error capturing fingerprint:', err);
      setError('Failed to capture device fingerprint');
    } finally {
      setIsCapturing(false);
    }
  };

  // Function to save fingerprint to MongoDB
  const saveFingerprint = async (visitorId: string) => {
    try {
      // Collect session data
      const sessionData = {
        sessionDuration: 0, // Will be updated when session ends
        lessonCompleted: false,
        hapticFeedbackEnabled: true, // Default to true, can be changed by user
        learningData: {} // Will be populated as user interacts with the app
      };
      
      // Send fingerprint to our API
      const response = await fetch('/api/customFingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save fingerprint');
      }
      
      // Store fingerprint in localStorage for future reference
      localStorage.setItem('fingerprint_id', visitorId);
      
    } catch (err) {
      console.error('Error saving fingerprint:', err);
      // Non-blocking error - we don't want to disrupt the user experience
    }
  };

  // Function to opt out of fingerprinting
  const handleOptOut = () => {
    localStorage.setItem('fingerprint_opt_out', 'true');
    setOptOut(true);
    setFingerprint(null);
  };

  // Function to opt back in
  const handleOptIn = () => {
    localStorage.removeItem('fingerprint_opt_out');
    setOptOut(false);
    captureFingerprint();
  };

  // Render nothing if autoCapture is true (invisible component)
  if (autoCapture) {
    return null;
  }

  // Otherwise render a UI component for user consent
  return (
    <div className="fingerprint-capture">
      {optOut ? (
        <div>
          <p>You have opted out of fingerprinting. Some features may be limited.</p>
          <button onClick={handleOptIn}>Opt In to Fingerprinting</button>
        </div>
      ) : (
        <div>
          {fingerprint ? (
            <div>
              <p>Fingerprint captured successfully!</p>
              <button onClick={handleOptOut}>Opt Out of Fingerprinting</button>
            </div>
          ) : (
            <div>
              <p>BrailleBuddy uses a privacy-friendly fingerprinting solution to remember your progress without requiring an account.</p>
              <p>No personally identifiable information is collected.</p>
              {error && <p className="error">{error}</p>}
              <button 
                onClick={captureFingerprint} 
                disabled={isCapturing}
              >
                {isCapturing ? 'Capturing...' : 'Capture Fingerprint'}
              </button>
              <button onClick={handleOptOut}>Opt Out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FingerprintCapture;
