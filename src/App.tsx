import React, { useEffect, useState } from 'react';
import { getFingerprint } from './lib/customFingerprint';
import { initHapticFeedback, HapticMode, triggerHapticFeedback } from './lib/hapticFeedback';
import ConsentPrompt from './components/ConsentPrompt';
import ConsentToggle from './components/ConsentToggle';
import FingerprintDisplay from './components/FingerprintDisplay';
import consentManager from './ConsentManager';
import { formatDate } from './lib/utils';

// Using our custom fingerprinting types
interface FingerprintComponents {
  [key: string]: any;
}

interface VisitorData {
  visits: Array<{
    timestamp: string;
    browserDetails: {
      browserName: string;
      browserVersion: string;
      os: string;
      osVersion: string;
    };
    sessionDuration?: number;
    lessonCompleted?: boolean;
    hapticFeedbackEnabled?: boolean;
  }>;
  learningProgress: {
    level: number;
    completedLessons: string[];
    accuracy: number;
    lastActivity: string;
    achievements: string[];
  };
  visitorId: string;
  firstSeen?: Date | string;
  lastSeen?: Date | string;
  components?: FingerprintComponents;
  hasConsent?: boolean;
  consentTimestamp?: Date | string | null;
  success?: boolean;
}

function App() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  // Always show consent prompt on first visit or when consent is not yet given
  const [showConsentPrompt, setShowConsentPrompt] = useState(true);
  const [consentGiven, setConsentGiven] = useState(consentManager.hasConsent());
  const [fingerprintComponents, setFingerprintComponents] = useState<FingerprintComponents | null>(null);

  // State to track haptic feedback availability
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(false);

  // Fetch fingerprint data
  const fetchFingerprint = async () => {
    if (!consentGiven) {
      setError('Consent required to fetch fingerprint');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get the fingerprint
      const visitorId = await getFingerprint();
      setFingerprint(visitorId);
      
      // Set the visitor ID in the consent manager for database sync
      consentManager.setVisitorId(visitorId);
      
      // Fetch detailed visitor data from our API
      const response = await fetch(`/api/customFingerprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch visitor data');
      }
      
      setVisitorData(data);
      
      // Set fingerprint components for display
      if (data.components) {
        setFingerprintComponents(data.components);
      }
      
      // Provide haptic feedback on successful fingerprint
      const hapticAvailable = initHapticFeedback();
      setHapticEnabled(hapticAvailable);
      triggerHapticFeedback('success', { mode: HapticMode.BIOLOGICAL, intensity: 7 });
    } catch (err) {
      setError('Error fetching fingerprint: ' + (err instanceof Error ? err.message : String(err)));
      
      // Provide haptic feedback on error
      triggerHapticFeedback('error', { mode: HapticMode.BIOLOGICAL, intensity: 6 });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Initialize haptic feedback system for both desktop and mobile
    const hapticAvailable = initHapticFeedback();
    setHapticEnabled(hapticAvailable);
    console.log('Haptic feedback enabled:', hapticAvailable);
    
    // Check if user has already given consent previously
    const hasExistingConsent = consentManager.hasConsent();
    if (hasExistingConsent) {
      setConsentGiven(true);
      setShowConsentPrompt(false);
      fetchFingerprint();
    }
    
    // Only fetch fingerprint if consent is given and we haven't already done so
    if (consentGiven && !fingerprint) {
      fetchFingerprint();
    }
  }, [consentGiven]);

  // Handle consent acceptance
  const handleAcceptConsent = async () => {
    await consentManager.setConsent(true);
    setConsentGiven(true);
    setShowConsentPrompt(false);
    
    // Provide haptic feedback on consent
    triggerHapticFeedback('consent-granted', { mode: HapticMode.BIOLOGICAL, intensity: 7 });
    
    // Log the consent event to console for debugging
    console.log('BBES: Consent accepted, fingerprinting will begin');
    
    // Fetch fingerprint immediately after consent
    fetchFingerprint();
  };

  // Handle consent decline
  const handleDeclineConsent = async () => {
    await consentManager.setConsent(false);
    setConsentGiven(false);
    setShowConsentPrompt(false);
    setError('Consent declined. Fingerprinting is required to use this application.');
    
    // Log the decline event
    console.log('BBES: Consent declined, fingerprinting disabled');
    
    // Clear fingerprint data when consent is declined
    setFingerprint('');
    setVisitorData(null);
    setFingerprintComponents(null);
  };
  
  // Toggle consent status
  const toggleConsent = async () => {
    const newStatus = consentManager.toggleConsent();
    setConsentGiven(newStatus);
    
    if (newStatus) {
      // If toggled to true, fetch fingerprint
      fetchFingerprint();
      
      // Provide haptic feedback
      const hapticAvailable = initHapticFeedback();
      if (hapticAvailable) {
        triggerHapticFeedback('toggle', { mode: HapticMode.RHYTHMIC, intensity: 3 });
      }
    } else {
      // If toggled to false, clear fingerprint data
      setFingerprint('');
      setVisitorData(null);
      setFingerprintComponents(null);
    }
  };

  // Show consent prompt
  if (showConsentPrompt) {
    return <ConsentPrompt onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />;
  }

  // Show loading state
  if (loading && consentGiven) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading BBES fingerprint data...</div>
      </div>
    );
  }

  // Show error state
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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">BBES Fingerprint Demo</h1>
            <p className="text-gray-600">Learn braille through interactive fingerprinting</p>
          </div>
          
          {/* Consent Toggle Component */}
          <ConsentToggle 
            initialConsent={consentGiven}
            onConsentChange={(newStatus) => {
              setConsentGiven(newStatus);
              if (newStatus) {
                fetchFingerprint();
              } else {
                setFingerprint('');
                setVisitorData(null);
                setFingerprintComponents(null);
              }
            }}
            visitorId={fingerprint}
            showEducationalInfo={true}
          />
        </header>
        
        {consentGiven && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your BBES Fingerprint ID</h2>
            <div className="bg-gray-100 p-4 rounded-md font-mono break-all">
              {fingerprint}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>This fingerprint is stored in MongoDB when consent is given.</p>
              <p>Toggle consent using the switch in the header to control data collection.</p>
              {visitorData?.hasConsent !== undefined && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-800">MongoDB Consent Status: 
                    <span className={visitorData.hasConsent ? 'text-green-600' : 'text-red-600'}>
                      {visitorData.hasConsent ? ' Active' : ' Inactive'}
                    </span>
                  </p>
                  {visitorData.consentTimestamp && (
                    <p className="text-blue-700">Last updated: {formatDate(visitorData.consentTimestamp)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Display fingerprint components if available */}
        {fingerprintComponents && consentGiven && visitorData && (
          <FingerprintDisplay 
            components={fingerprintComponents}
            visitorId={fingerprint}
            firstSeen={visitorData.firstSeen}
            lastSeen={visitorData.lastSeen}
            hasConsent={visitorData.hasConsent || false}
            consentTimestamp={visitorData.consentTimestamp}
          />
        )}

        {visitorData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Visitor History</h2>
            <div className="space-y-6">
              {visitorData.visits.map((visit, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
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
                      <p className="text-sm text-gray-500">Timestamp</p>
                      <p>{new Date(visit.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Session Duration</p>
                      <p>{visit.sessionDuration ? `${visit.sessionDuration} seconds` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lesson Completed</p>
                      <p>{visit.lessonCompleted ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Haptic Feedback</p>
                      <p>{visit.hapticFeedbackEnabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Learning Progress</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Level</p>
                <p>{visitorData.learningProgress.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Accuracy</p>
                <p>{visitorData.learningProgress.accuracy}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p>{new Date(visitorData.learningProgress.lastActivity).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Lessons</p>
                <p>{visitorData.learningProgress.completedLessons.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Achievements</p>
                <p>{visitorData.learningProgress.achievements.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;