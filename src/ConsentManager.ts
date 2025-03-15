/**
 * Consent Manager for BrailleBuddy Fingerprinting System (BBES)
 * 
 * Handles user consent for fingerprinting and stores consent status both locally
 * and in MongoDB for persistence across devices.
 * Includes haptic feedback for enhanced accessibility.
 */

import dbConnect from './lib/db';
import ConsentModel from './models/Consent';
import { initHapticFeedback, triggerHapticFeedback, HapticMode } from './lib/hapticFeedback';

const CONSENT_STORAGE_KEY = 'bbes_consent';
const CONSENT_TIMESTAMP_KEY = 'bbes_consent_timestamp';
const CONSENT_VERSION = '1.0';

export interface ConsentOptions {
  /** Duration in days before consent expires */
  expirationDays?: number;
  /** Whether to log consent events */
  enableLogging?: boolean;
  /** Whether to use MongoDB for persistence */
  useDatabase?: boolean;
}

export class ConsentManager {
  private options: ConsentOptions;
  private visitorId: string | null = null;
  
  constructor(options: ConsentOptions = {}) {
    this.options = {
      expirationDays: options.expirationDays ?? 30,
      enableLogging: options.enableLogging ?? true,
      useDatabase: options.useDatabase ?? true
    };
  }
  
  /**
   * Set the visitor ID for the current user
   * This is required for database persistence
   */
  setVisitorId(id: string): void {
    this.visitorId = id;
    
    // Check database for existing consent after setting ID
    if (this.options.useDatabase) {
      this.syncWithDatabase();
    }
  }
  
  /**
   * Check if user has given consent
   */
  hasConsent(): boolean {
    try {
      const consentValue = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (consentValue !== 'true') {
        return false;
      }
      
      // Check if consent has expired
      const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
      if (timestamp) {
        const consentDate = new Date(timestamp);
        const now = new Date();
        const daysSinceConsent = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceConsent > this.options.expirationDays!) {
          this.clearConsent();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }
  
  /**
   * Toggle consent status
   */
  toggleConsent(): boolean {
    const currentStatus = this.hasConsent();
    this.setConsent(!currentStatus);
    return !currentStatus;
  }
  
  /**
   * Set user consent with haptic feedback
   */
  async setConsent(consented: boolean): Promise<void> {
    try {
      // Provide haptic feedback based on consent action
      const hapticAvailable = initHapticFeedback();
      if (hapticAvailable) {
        // Use specific consent patterns with appropriate haptic mode
        triggerHapticFeedback(
          consented ? 'consent-granted' : 'consent-revoked',
          {
            mode: consented ? HapticMode.BIOLOGICAL : HapticMode.RHYTHMIC,
            intensity: consented ? 7 : 4,  // Stronger feedback for granting consent
            duration: consented ? 200 : 150
          }
        );
      }
      
      // Update local storage
      if (consented) {
        localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
        localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
      } else {
        this.clearLocalConsent();
      }
      
      // Log the event
      if (this.options.enableLogging) {
        console.log(`BBES: Consent ${consented ? 'granted' : 'declined'}`, new Date().toISOString());
        this.logConsentEvent(consented ? 'granted' : 'declined');
      }
      
      // Update database if enabled and we have a visitor ID
      if (this.options.useDatabase && this.visitorId) {
        await this.updateDatabaseConsent(consented);
      }
    } catch (error) {
      // Error feedback
      const hapticAvailable = initHapticFeedback();
      if (hapticAvailable) {
        triggerHapticFeedback('error', { 
          mode: HapticMode.FREQUENCY, 
          intensity: 6, 
          duration: 150 
        });
      }
      console.error('Error setting consent:', error);
    }
  }
  
  /**
   * Clear user consent from local storage only
   */
  clearLocalConsent(): void {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing local consent:', error);
    }
  }
  
  /**
   * Clear user consent from both local storage and database
   */
  async clearConsent(): Promise<void> {
    this.clearLocalConsent();
    
    // Clear from database if enabled
    if (this.options.useDatabase && this.visitorId) {
      await this.updateDatabaseConsent(false);
    }
  }
  
  /**
   * Log consent event to server with haptic feedback
   */
  private logConsentEvent(status: 'granted' | 'declined'): void {
    try {
      // Provide haptic feedback to indicate server communication
      const hapticAvailable = initHapticFeedback();
      if (hapticAvailable) {
        triggerHapticFeedback('progress', { 
          mode: HapticMode.RHYTHMIC, 
          intensity: 3, 
          duration: 80 
        });
      }
      
      // Send consent status to server with educational context for children
      fetch('/api/consentLog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          visitorId: this.visitorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          consentVersion: CONSENT_VERSION,
          // Add educational context for children
          consentContext: {
            action: status,
            purpose: 'braille-learning-progress',
            dataRetention: '90-days',
            accessibleFormat: true
          }
        })
      })
      .then(() => {
        // Success feedback
        if (hapticAvailable) {
          triggerHapticFeedback('success', { 
            mode: HapticMode.BIOLOGICAL, 
            intensity: 5, 
            duration: 100 
          });
        }
      })
      .catch(err => {
        // Error feedback
        if (hapticAvailable) {
          triggerHapticFeedback('error', { 
            mode: HapticMode.FREQUENCY, 
            intensity: 4, 
            duration: 120 
          });
        }
        console.debug('Failed to log consent event:', err);
      });
    } catch (error) {
      // Ignore errors in logging
    }
  }
  
  /**
   * Sync consent status with database
   */
  private async syncWithDatabase(): Promise<void> {
    if (!this.visitorId || !this.options.useDatabase) {
      return;
    }
    
    try {
      await dbConnect();
      
      // Find consent record in database
      const consentRecord = await ConsentModel.findOne({ visitorId: this.visitorId });
      
      if (consentRecord) {
        // Update local storage to match database
        if (consentRecord.consented) {
          localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
          localStorage.setItem(CONSENT_TIMESTAMP_KEY, consentRecord.timestamp.toISOString());
        } else {
          this.clearLocalConsent();
        }
        
        if (this.options.enableLogging) {
          console.log(`BBES: Synced consent from database: ${consentRecord.consented ? 'granted' : 'declined'}`);
        }
      } else if (this.hasConsent()) {
        // If we have local consent but no database record, create one
        await this.updateDatabaseConsent(true);
      }
    } catch (error) {
      console.error('Error syncing consent with database:', error);
    }
  }
  
  /**
   * Update consent status in database
   */
  private async updateDatabaseConsent(consented: boolean): Promise<void> {
    if (!this.visitorId || !this.options.useDatabase) {
      return;
    }
    
    try {
      await dbConnect();
      
      const now = new Date();
      const userAgent = navigator.userAgent;
      
      // Update or create consent record
      await ConsentModel.findOneAndUpdate(
        { visitorId: this.visitorId },
        {
          $set: {
            consented,
            timestamp: now,
            userAgent,
            consentVersion: CONSENT_VERSION
          },
          $push: {
            consentHistory: {
              status: consented,
              timestamp: now,
              userAgent
            }
          }
        },
        { upsert: true }
      );
      
      if (this.options.enableLogging) {
        console.log(`BBES: Updated database consent: ${consented ? 'granted' : 'declined'}`);
      }
    } catch (error) {
      console.error('Error updating consent in database:', error);
    }
  }
}

// Export singleton instance
export const consentManager = new ConsentManager();

export default consentManager;
