import React, { useState, useEffect } from 'react';
import consentManager from '../ConsentManager';
import { initHapticFeedback, triggerHapticFeedback, HapticMode } from '../lib/hapticFeedback';

interface ConsentToggleProps {
  initialConsent: boolean;
  onConsentChange: (consented: boolean) => void;
  visitorId?: string;
  showEducationalInfo?: boolean;
}

/**
 * A toggle component for managing user consent with haptic feedback and educational information
 * Designed to be accessible and child-friendly for the BrailleBuddy application
 */
const ConsentToggle: React.FC<ConsentToggleProps> = ({
  initialConsent,
  onConsentChange,
  visitorId,
  showEducationalInfo = true
}) => {
  const [consented, setConsented] = useState(initialConsent);
  const [showInfo, setShowInfo] = useState(false);

  // Set visitor ID in consent manager if provided
  useEffect(() => {
    if (visitorId) {
      consentManager.setVisitorId(visitorId);
    }
  }, [visitorId]);

  // Toggle consent status
  const toggleConsent = async () => {
    const newStatus = !consented;
    setConsented(newStatus);
    
    // Update consent in manager
    await consentManager.setConsent(newStatus);
    
    // Provide haptic feedback
    const hapticAvailable = initHapticFeedback();
    if (hapticAvailable) {
      triggerHapticFeedback(
        newStatus ? 'success' : 'warning', 
        { 
          mode: newStatus ? HapticMode.STANDARD : HapticMode.RHYTHMIC, 
          intensity: newStatus ? 5 : 3 
        }
      );
    }
    
    // Notify parent component
    onConsentChange(newStatus);
  };

  return (
    <div className="consent-toggle">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-3 text-sm font-medium text-gray-700">
            {consented ? 'Learning Data: On' : 'Learning Data: Off'}
          </span>
          <button 
            onClick={toggleConsent}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${consented ? 'bg-indigo-600' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={consented}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consented ? 'translate-x-6' : 'translate-x-1'}`} 
            />
          </button>
        </div>
        
        {showEducationalInfo && (
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
            aria-label="Learn more about data collection"
          >
            What's this?
          </button>
        )}
      </div>
      
      {showInfo && showEducationalInfo && (
        <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
          <h4 className="font-medium text-blue-800 mb-1">Learning Data Collection</h4>
          <p className="text-blue-700 mb-2">
            When this is ON, BrailleBuddy remembers how you're learning and can:
          </p>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>Remember which braille characters you've learned</li>
            <li>Adjust lessons to match your skill level</li>
            <li>Save your progress so you can continue later</li>
            <li>Create personalized practice sessions</li>
          </ul>
          <p className="mt-2 text-blue-700">
            You can turn this OFF anytime, but your progress won't be saved.
          </p>
          <div className="flex justify-end mt-2">
            <button 
              onClick={() => setShowInfo(false)}
              className="text-xs text-blue-700 hover:text-blue-900"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentToggle;
