import mongoose from 'mongoose';

const FingerprintSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    unique: true,
  },
  visits: [{
    requestId: String,
    timestamp: Date,
    browserDetails: {
      browserName: String,
      browserVersion: String,
      os: String,
      osVersion: String,
    },
    incognito: Boolean,
    ip: String,
    ipLocation: {
      country: String,
      city: String,
    },
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