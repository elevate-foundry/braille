import React from 'react';
import { formatDate } from '../lib/utils';
import { initHapticFeedback, triggerHapticFeedback, HapticMode } from '../lib/hapticFeedback';

interface FingerprintComponentsProps {
  components: Record<string, any>;
  visitorId: string;
  firstSeen?: string | Date;
  lastSeen?: string | Date;
  hasConsent: boolean;
  consentTimestamp?: string | Date | null;
}

/**
 * A child-friendly component to display fingerprint components
 * Designed to be educational and engaging for children learning braille
 */
const FingerprintDisplay: React.FC<FingerprintComponentsProps> = ({
  components,
  visitorId,
  firstSeen,
  lastSeen,
  hasConsent,
  consentTimestamp
}) => {
  // Function to trigger haptic feedback when a component is clicked
  const handleComponentClick = (componentName: string) => {
    const hapticAvailable = initHapticFeedback();
    if (hapticAvailable) {
      // Use different patterns for different components
      const pattern = componentName.toLowerCase().charAt(0);
      triggerHapticFeedback(pattern, {
        mode: HapticMode.BIOLOGICAL,
        intensity: 5,
        duration: 100
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Your Digital Fingerprint</h2>
      
      <div className="text-sm text-gray-600 mb-4">
        <p>Consent status: 
          <span className={`font-semibold ml-1 ${hasConsent ? 'text-green-600' : 'text-red-600'}`}>
            {hasConsent ? 'Active' : 'Inactive'}
          </span>
        </p>
        {consentTimestamp && (
          <p>Last updated: {formatDate(consentTimestamp)}</p>
        )}
        {firstSeen && (
          <p>First seen: {formatDate(firstSeen)}</p>
        )}
        {lastSeen && (
          <p>Last seen: {formatDate(lastSeen)}</p>
        )}
      </div>
      
      {/* Educational note about fingerprinting for children */}
      <div className="bg-yellow-50 p-3 rounded-md mb-6 text-sm">
        <h3 className="font-medium text-yellow-800 mb-1">Learning About Digital Fingerprints</h3>
        <p className="text-yellow-700 mb-2">
          Just like your real fingerprint is unique to you, your device has a special "digital fingerprint" 
          that helps BrailleBuddy remember your progress. This helps us create better braille lessons just for you!
        </p>
        <p className="text-yellow-700">
          Tap on each section below to feel a special vibration pattern for each part of your fingerprint!
        </p>
      </div>
      
      {/* Fingerprint ID display */}
      <div className="bg-indigo-50 p-3 rounded-md mb-6">
        <h3 className="font-medium text-indigo-800 mb-1">Your Fingerprint ID</h3>
        <div className="font-mono text-sm break-all bg-white p-2 rounded border border-indigo-200">
          {visitorId}
        </div>
      </div>
      
      {/* Components display */}
      <div className="space-y-4">
        {Object.entries(components).map(([key, value]) => (
          <div 
            key={key} 
            className="border rounded-md p-3 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => handleComponentClick(key)}
          >
            <h3 className="font-medium text-gray-800 mb-2 capitalize">{key}</h3>
            {typeof value === 'object' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(value).map(([subKey, subValue]) => (
                  <div key={subKey} className="flex">
                    <div className="font-medium text-gray-600 mr-2 capitalize">{subKey}:</div>
                    <div className="font-mono text-sm break-all">
                      {typeof subValue === 'object' 
                        ? JSON.stringify(subValue)
                        : String(subValue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-mono text-sm break-all">{String(value)}</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Braille connection */}
      <div className="mt-6 bg-green-50 p-3 rounded-md">
        <h3 className="font-medium text-green-800 mb-1">Braille Connection</h3>
        <p className="text-green-700 mb-2">
          Just like braille uses patterns of dots to represent letters, your digital fingerprint 
          uses patterns of information to represent your device!
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {['a', 'b', 'c', 'd', 'e', 'f'].map(char => (
            <button
              key={char}
              className="px-3 py-2 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
              onClick={() => {
                const hapticAvailable = initHapticFeedback();
                if (hapticAvailable) {
                  triggerHapticFeedback(char, {
                    mode: HapticMode.BIOLOGICAL,
                    intensity: 6,
                    duration: 150
                  });
                }
              }}
            >
              Feel "{char}" in braille
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FingerprintDisplay;
