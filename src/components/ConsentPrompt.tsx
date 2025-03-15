import React from 'react';

interface ConsentPromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ConsentPrompt: React.FC<ConsentPromptProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-4">
        <h2 className="text-2xl font-bold mb-4">Consent for Braille Fingerprinting</h2>
        
        <div className="prose prose-sm mb-6">
          <p className="mb-3">
            Welcome to the BrailleBuddy Fingerprinting System (BBES). Before proceeding, we need your consent to collect and display your browser fingerprint.
          </p>
          
          <p className="mb-3">
            <strong>What is browser fingerprinting?</strong> Browser fingerprinting is a technique that collects information about your browser, device, and settings to create a unique identifier.
          </p>
          
          <p className="mb-3">
            <strong>How we use this data:</strong> The BBES fingerprint helps us improve the BrailleBuddy learning experience by:
          </p>
          
          <ul className="list-disc pl-5 mb-3">
            <li>Remembering your learning progress without requiring account creation</li>
            <li>Customizing haptic feedback based on your device capabilities</li>
            <li>Adapting the interface to your specific browser environment</li>
            <li>Improving accessibility features for all users</li>
          </ul>
          
          <p className="mb-3">
            <strong>Your privacy:</strong> We do not collect personally identifiable information. Your fingerprint is anonymized and used solely for enhancing your BrailleBuddy experience.
          </p>
          
          <p className="mb-3">
            By clicking "Accept", you consent to the collection and display of your BBES fingerprint. You can view the complete fingerprint data after acceptance.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button 
            onClick={onDecline}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={onAccept}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentPrompt;
