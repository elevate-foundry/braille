import mongoose from 'mongoose';

/**
 * Fingerprint Schema for BrailleBuddy
 * 
 * Stores hashed fingerprints and user learning progress data
 * without collecting personally identifiable information
 */
const FingerprintSchema = new mongoose.Schema({
  // Hashed fingerprint ID from our custom solution
  visitorId: {
    type: String,
    required: true,
    unique: true,
  },
  // User learning progress data
  learningProgress: {
    level: {
      type: Number,
      default: 1,
    },
    completedLessons: [String],
    accuracy: {
      type: Number,
      default: 0,
    },
    lastActivity: Date,
    achievements: [String],
  },
  // Visit history with minimal data for analytics
  visits: [{
    timestamp: Date,
    // Browser details without PII
    browserDetails: {
      browserName: String,
      browserVersion: String,
      os: String,
      osVersion: String,
    },
    // Session data
    sessionDuration: Number,
    lessonCompleted: Boolean,
    hapticFeedbackEnabled: Boolean,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
FingerprintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Fingerprint || mongoose.model('Fingerprint', FingerprintSchema);