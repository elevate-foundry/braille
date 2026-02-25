/**
 * MongoDB model for storing user consent information
 * This allows consent status to persist across devices and sessions
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ConsentDocument extends Document {
  visitorId: string;
  consented: boolean;
  timestamp: Date;
  userAgent?: string;
  ipHash?: string;
  consentVersion: string;
  educationalMetadata?: {
    friendlyDescription?: string;
    dataUsage?: string;
    privacyFriendly?: boolean;
    lastUpdated?: Date;
    hapticFeedbackEnabled?: boolean;
    [key: string]: any; // Allow for additional educational context
  };
  consentHistory: Array<{
    status: boolean;
    timestamp: Date;
    userAgent?: string;
    context?: Record<string, any>;
  }>;
}

const ConsentSchema = new Schema<ConsentDocument>({
  // Use the fingerprint visitorId as the unique identifier
  visitorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Current consent status
  consented: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // When consent was last updated
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // User agent string (for audit purposes)
  userAgent: {
    type: String
  },
  
  // Hashed IP address (for audit purposes, not PII)
  ipHash: {
    type: String
  },
  
  // Version of the consent form that was accepted
  consentVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  
  // Educational metadata for children
  educationalMetadata: {
    friendlyDescription: String,
    dataUsage: String,
    privacyFriendly: Boolean,
    lastUpdated: Date,
    hapticFeedbackEnabled: Boolean,
    // Allow for additional fields without defining them explicitly
    type: Map,
    of: Schema.Types.Mixed
  },
  
  // History of consent changes
  consentHistory: [{
    status: Boolean,
    timestamp: Date,
    userAgent: String,
    context: {
      type: Map,
      of: Schema.Types.Mixed
    }
  }]
});

// Create or get the model
const ConsentModel = mongoose.models.Consent || mongoose.model<ConsentDocument>('Consent', ConsentSchema);

export default ConsentModel;
