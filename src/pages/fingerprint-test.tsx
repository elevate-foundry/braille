import { useState, useEffect } from 'react';
import FingerprintCapture from '../components/FingerprintCapture.js';

// Using inline styles instead of CSS modules for better compatibility
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  },
  title: {
    color: '#333',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    fontSize: '2.5rem'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '2rem'
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '1rem',
    marginRight: '0.5rem'
  },
  error: {
    color: '#dc2626',
    fontWeight: 500
  }
};

/**
 * Test page to demonstrate live fingerprint capture
 * Shows how to integrate fingerprinting with the BrailleBuddy application
 */
export default function FingerprintTest() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load fingerprint from localStorage on page load
  useEffect(() => {
    const storedFingerprint = localStorage.getItem('fingerprint_id');
    if (storedFingerprint) {
      setFingerprint(storedFingerprint);
      fetchUserProgress(storedFingerprint);
    }
  }, []);

  // Handle fingerprint capture
  const handleFingerprintCaptured = (visitorId: string) => {
    setFingerprint(visitorId);
    fetchUserProgress(visitorId);
  };

  // Fetch user progress from MongoDB using the fingerprint
  const fetchUserProgress = async (visitorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/getUserProgress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }

      const data = await response.json();
      setUserProgress(data);
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError('Failed to load your learning progress');
    } finally {
      setLoading(false);
    }
  };

  // Simulate completing a lesson
  const simulateCompletedLesson = async () => {
    if (!fingerprint) return;

    try {
      setLoading(true);
      
      // Update session data
      const sessionData = {
        visitorId: fingerprint,
        sessionDuration: 300, // 5 minutes
        lessonCompleted: true,
        hapticFeedbackEnabled: true,
        learningData: {
          lessonId: 'letter_b',
          accuracy: 0.92,
          timeSpent: 240, // 4 minutes
          mistakes: 2
        }
      };
      
      // Send to API
      const response = await fetch('/api/customFingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      
      // Refresh user progress
      fetchUserProgress(fingerprint);
      
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update your learning progress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>BrailleBuddy Fingerprint Test</h1>
      
      <div style={styles.card}>     <h2>Fingerprint Capture</h2>
        {fingerprint ? (
          <div>
            <p>Your fingerprint ID: <code>{fingerprint.substring(0, 10)}...</code></p>
            <button 
              style={styles.button}
              onClick={() => {
                localStorage.removeItem('fingerprint_id');
                localStorage.removeItem('fingerprint_opt_out');
                setFingerprint(null);
                setUserProgress(null);
              }}
            >
              Reset Fingerprint
            </button>
          </div>
        ) : (
          <FingerprintCapture 
            onFingerprintCaptured={handleFingerprintCaptured}
            autoCapture={false}
          />
        )}
      </div>

      {fingerprint && (
        <div style={styles.card}>
          <h2>User Progress</h2>
          {loading ? (
            <p>Loading your progress...</p>
          ) : error ? (
            <p style={styles.error}>{error}</p>
          ) : userProgress ? (
            <div>
              <h3>Learning Progress</h3>
              <ul>
                <li>Level: {userProgress.learningProgress.level}</li>
                <li>Completed Lessons: {userProgress.learningProgress.completedLessons.length}</li>
                <li>Accuracy: {(userProgress.learningProgress.accuracy * 100).toFixed(1)}%</li>
                <li>Last Activity: {new Date(userProgress.learningProgress.lastActivity).toLocaleString()}</li>
              </ul>
              
              <h3>Visit History</h3>
              <p>Total Visits: {userProgress.visits.length}</p>
              
              <button 
                style={styles.button}
                onClick={simulateCompletedLesson}
                disabled={loading}
              >
                Simulate Completed Lesson
              </button>
            </div>
          ) : (
            <p>No progress data found. Start learning to create your profile!</p>
          )}
        </div>
      )}

      <div style={styles.card}>
        <h2>How It Works</h2>
        <p>
          BrailleBuddy uses a privacy-focused fingerprinting solution to remember your progress
          without requiring account creation. This approach:
        </p>
        <ul>
          <li>Collects no personally identifiable information</li>
          <li>Processes all data locally in your browser</li>
          <li>Allows you to opt out at any time</li>
          <li>Stores only your learning progress and preferences</li>
        </ul>
        <p>
          The fingerprint is created by combining various browser attributes that,
          when combined, create a unique identifier. This includes:
        </p>
        <ul>
          <li>Browser and device capabilities (not your IP address)</li>
          <li>Screen resolution and color depth</li>
          <li>Installed fonts and plugins</li>
          <li>Canvas and WebGL rendering characteristics</li>
        </ul>
      </div>
    </div>
  );
}
