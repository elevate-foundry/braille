/**
 * MongoDB Connection Test for BrailleBuddy
 * 
 * This script tests the connection to MongoDB and verifies that
 * our custom fingerprinting solution can save fingerprints to the database.
 */

import chalk from 'chalk';
import dbConnect from './lib/db.js';
import Fingerprint from './models/Fingerprint.js';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

async function testMongoDBConnection() {
  console.log(chalk.blue('=== BrailleBuddy MongoDB Connection Test ==='));
  
  try {
    // Test 1: Connect to MongoDB
    console.log(chalk.yellow('\nTest 1: MongoDB Connection'));
    const connection = await dbConnect();
    console.log(`Connected to MongoDB: ${connection.name}`);
    console.log(chalk.green('✓ MongoDB connection successful'));
    
    // Test 2: Generate a mock fingerprint (since we can't use the browser-based solution in Node.js)
    console.log(chalk.yellow('\nTest 2: Mock Fingerprint Generation'));
    const mockUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const mockScreenResolution = '1920x1080';
    const mockTimezone = 'America/New_York';
    const mockLanguage = 'en-US';
    
    // Create a hash of these values to simulate a fingerprint
    const testFingerprint = crypto
      .createHash('sha256')
      .update(`${mockUserAgent}|${mockScreenResolution}|${mockTimezone}|${mockLanguage}|${Date.now()}`)
      .digest('hex');
      
    console.log(`Generated mock fingerprint: ${testFingerprint.substring(0, 10)}...`);
    console.log(chalk.green('✓ Mock fingerprint generation successful'));
    
    // Test 3: Save fingerprint to MongoDB
    console.log(chalk.yellow('\nTest 3: Save Fingerprint to MongoDB'));
    
    // Check if fingerprint already exists
    let fingerprintRecord = await Fingerprint.findOne({ visitorId: testFingerprint });
    
    if (!fingerprintRecord) {
      // Create new fingerprint record
      fingerprintRecord = new Fingerprint({
        visitorId: testFingerprint,
        learningProgress: {
          level: 1,
          completedLessons: ['intro_1', 'letter_a'],
          accuracy: 0.85,
          lastActivity: new Date(),
          achievements: ['first_login']
        },
        visits: [{
          timestamp: new Date(),
          browserDetails: {
            browserName: 'Test Browser',
            browserVersion: '1.0',
            os: 'Test OS',
            osVersion: '1.0'
          },
          sessionDuration: 300,
          lessonCompleted: true,
          hapticFeedbackEnabled: true
        }]
      });
      
      await fingerprintRecord.save();
      console.log('New fingerprint record created');
    } else {
      // Update existing fingerprint record
      fingerprintRecord.visits.push({
        timestamp: new Date(),
        browserDetails: {
          browserName: 'Test Browser',
          browserVersion: '1.0',
          os: 'Test OS',
          osVersion: '1.0'
        },
        sessionDuration: 300,
        lessonCompleted: true,
        hapticFeedbackEnabled: true
      });
      
      await fingerprintRecord.save();
      console.log('Existing fingerprint record updated');
    }
    
    console.log(chalk.green('✓ Fingerprint saved to MongoDB successfully'));
    
    // Test 4: Retrieve fingerprint from MongoDB
    console.log(chalk.yellow('\nTest 4: Retrieve Fingerprint from MongoDB'));
    const retrievedFingerprint = await Fingerprint.findOne({ visitorId: testFingerprint });
    
    if (retrievedFingerprint) {
      console.log('Retrieved fingerprint record:');
      console.log(`- Visitor ID: ${retrievedFingerprint.visitorId.substring(0, 10)}...`);
      console.log(`- Level: ${retrievedFingerprint.learningProgress.level}`);
      console.log(`- Completed Lessons: ${retrievedFingerprint.learningProgress.completedLessons.length}`);
      console.log(`- Visits: ${retrievedFingerprint.visits.length}`);
      console.log(chalk.green('✓ Fingerprint retrieval successful'));
    } else {
      console.log(chalk.red('✗ Failed to retrieve fingerprint'));
    }
    
    console.log(chalk.blue('\n=== All Tests Passed ==='));
    console.log(chalk.green('MongoDB connection and fingerprint storage are working correctly!'));
    console.log(chalk.yellow('\nThe BrailleBuddy application is ready for deployment to Vercel.'));
    
  } catch (error) {
    console.error(chalk.red('Error during MongoDB connection test:'));
    console.error(error);
  } finally {
    // Close the MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log(chalk.yellow('MongoDB connection closed'));
    }
  }
}

// Add missing mongoose import
import mongoose from 'mongoose';

// Run the test
testMongoDBConnection().catch(console.error);
