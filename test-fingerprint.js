// Test script to generate fingerprint and braille encoding
import { getFingerprint } from './src/lib/customFingerprint.js';
import CryptoJS from 'crypto-js';

// Function to compress text to braille
function compressToBraille(text) {
  // Simple braille mapping for demonstration
  const brailleMap = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
    'z': '⠵', ' ': '⠀'
  };

  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
}

// Function to generate binary representation of braille patterns
function brailleToBinary(brailleText) {
  const brailleBinaryMap = {
    '⠁': '100000', '⠃': '110000', '⠉': '100100', '⠙': '100110',
    '⠑': '100010', '⠋': '110100', '⠛': '110110', '⠓': '110010',
    '⠊': '010100', '⠚': '010110', '⠅': '101000', '⠇': '111000',
    '⠍': '101100', '⠝': '101110', '⠕': '101010', '⠏': '111100',
    '⠟': '111110', '⠗': '111010', '⠎': '011100', '⠞': '011110',
    '⠥': '101001', '⠧': '111001', '⠺': '010111', '⠭': '101101',
    '⠽': '101111', '⠵': '101011', '⠀': '000000'
  };

  return brailleText.split('').map(char => brailleBinaryMap[char] || '000000').join(' ');
}

// Generate server-side fingerprint
async function generateServerFingerprint() {
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
  const hashOutput = CryptoJS.SHA256(userAgent + Date.now().toString());
  return hashOutput.toString(CryptoJS.enc.Hex);
}

// Main function to run tests
async function runTests() {
  try {
    // Get client-side fingerprint (this will only work in browser environment)
    console.log('Attempting to get client-side fingerprint...');
    let clientFingerprint = 'Not available in Node.js environment';
    
    try {
      clientFingerprint = await getFingerprint();
    } catch (error) {
      console.log('Error getting client fingerprint:', error.message);
    }
    
    // Generate server-side fingerprint
    const serverFingerprint = await generateServerFingerprint();
    
    // Sample text to encode
    const sampleText = 'hello braille buddy';
    const brailleText = compressToBraille(sampleText);
    const binaryEncoding = brailleToBinary(brailleText);
    
    // Output results
    console.log('\n===== BrailleBuddy Fingerprint & Encoding Test =====');
    console.log('Client Fingerprint:', clientFingerprint);
    console.log('Server Fingerprint:', serverFingerprint);
    console.log('\nSample Text:', sampleText);
    console.log('Braille Encoding:', brailleText);
    console.log('Binary Representation:', binaryEncoding);
    console.log('\nFingerprint Hash for API:', serverFingerprint.substring(0, 16));
    
    // Create a unique identifier based on the fingerprint
    const uniqueId = serverFingerprint.substring(0, 8);
    console.log('Unique User ID:', uniqueId);
    
    // Generate braille pattern for the unique ID
    const brailleId = compressToBraille(uniqueId);
    console.log('Braille User ID:', brailleId);
    console.log('Binary User ID:', brailleToBinary(brailleId));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
