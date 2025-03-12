# BBID: BrailleBuddy Identity Format Specification

**Version:** 1.0.0  
**Author:** Elevate Foundry  
**Date:** March 12, 2025  
**Status:** Draft Specification  

## Abstract

This document specifies the BBID (BrailleBuddy Identity) file format, a method for storing and transferring device identities using BBES (Braille Binary Encoding Standard). BBID provides a compact, accessible, and secure way to represent device fingerprints and associated metadata, enabling cross-device identity verification without traditional authentication methods.

## 1. Introduction

### 1.1 Purpose

BBID was developed to create a device identity format that is:
- Portable across different platforms and devices
- Accessible to individuals with visual impairments through Braille representation
- Capable of being represented through haptic feedback
- Secure and tamper-resistant
- Compact and efficient

### 1.2 Scope

This specification covers:
- The structure and format of BBID files
- Required and optional fields
- Encoding and decoding processes
- Security considerations
- Implementation guidelines

### 1.3 Background

BBID builds upon the BBES (Braille Binary Encoding Standard) to create a specialized format for device identity representation. While BBES provides the encoding mechanism, BBID defines the structure and semantics of the encoded data specifically for device identification purposes.

## 2. BBID File Format

### 2.1 File Structure

A BBID file is a JSON document with the following structure:

```json
{
  "version": "1.0.0",
  "metadata": {
    "created": "2025-03-12T12:34:56Z",
    "modified": "2025-03-12T12:34:56Z",
    "name": "My Linux Laptop",
    "type": "laptop",
    "os": "linux",
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
  },
  "fingerprint": {
    "raw": "a1b2c3d4e5f6...",
    "bbes": "⠁⠁⠃⠃⠉⠃⠙⠃⠑⠃⠋⠃...",
    "algorithm": "sha256",
    "components": {
      "hardware": "...",
      "browser": "...",
      "canvas": "...",
      "webgl": "...",
      "audio": "..."
    }
  },
  "verification": {
    "signature": "...",
    "timestamp": "2025-03-12T12:34:56Z"
  }
}
```

### 2.2 Field Descriptions

#### 2.2.1 Required Fields

- **version**: The version of the BBID specification (string)
- **metadata.created**: ISO 8601 timestamp of when the BBID was created (string)
- **metadata.name**: User-assigned name for the device (string)
- **fingerprint.raw**: The raw hexadecimal fingerprint (string)
- **fingerprint.bbes**: The BBES-encoded fingerprint (string)

#### 2.2.2 Optional Fields

- **metadata.modified**: ISO 8601 timestamp of when the BBID was last modified (string)
- **metadata.type**: Type of device (string: "desktop", "laptop", "tablet", "phone", "other")
- **metadata.os**: Operating system (string: "windows", "macos", "linux", "ios", "android", "other")
- **metadata.userAgent**: User agent string from the browser (string)
- **fingerprint.algorithm**: Hash algorithm used to generate the fingerprint (string)
- **fingerprint.components**: Individual components used to generate the fingerprint (object)
- **verification.signature**: Digital signature for verification (string)
- **verification.timestamp**: ISO 8601 timestamp of when the signature was created (string)

### 2.3 File Extension

BBID files use the `.bbid` extension.

## 3. Fingerprint Generation

### 3.1 Component Collection

A BBID fingerprint should be generated from multiple device characteristics to ensure uniqueness:

1. **Hardware Information**:
   - CPU cores and architecture
   - Available memory
   - Screen resolution and color depth
   - Available sensors

2. **Browser/Environment Information**:
   - User agent
   - Installed plugins and MIME types
   - Language and timezone
   - Local storage availability

3. **Canvas Fingerprinting**:
   - Rendering of specific shapes and text
   - WebGL capabilities and renderer information

4. **Audio Fingerprinting**:
   - AudioContext processing characteristics

### 3.2 Fingerprint Calculation

1. Collect all available components
2. Normalize data formats
3. Concatenate components in a consistent order
4. Generate a cryptographic hash (SHA-256 recommended)
5. Encode the hash in BBES format

## 4. Security Considerations

### 4.1 Tamper Resistance

To prevent tampering, BBID files can include a digital signature in the `verification.signature` field. This signature should be generated using a private key and can be verified using a corresponding public key.

### 4.2 Privacy Considerations

BBID files contain sensitive device information. Implementations should:

1. Store BBID files securely
2. Obtain user consent before generating or storing fingerprints
3. Provide clear options for users to delete their device fingerprints
4. Avoid sharing raw fingerprint data with third parties

### 4.3 Fingerprint Stability

Device fingerprints may change over time due to software updates, hardware changes, or other factors. Implementations should:

1. Focus on stable device characteristics
2. Implement fuzzy matching for fingerprint comparison
3. Periodically update stored fingerprints
4. Track fingerprint changes over time

## 5. Implementation Guidelines

### 5.1 JavaScript Implementation

```javascript
class BBIDManager {
    constructor() {
        this.deviceFingerprint = new DeviceFingerprint();
    }
    
    async generateBBID(deviceName, deviceType = 'other', deviceOS = 'other') {
        // Initialize fingerprint
        await this.deviceFingerprint.initialize();
        
        const rawFingerprint = this.deviceFingerprint.getRawFingerprint();
        const bbesFingerprint = this.deviceFingerprint.getFingerprint();
        
        // Create BBID structure
        const bbid = {
            version: "1.0.0",
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                name: deviceName,
                type: deviceType,
                os: deviceOS,
                userAgent: navigator.userAgent
            },
            fingerprint: {
                raw: rawFingerprint,
                bbes: bbesFingerprint,
                algorithm: "sha256",
                components: this.deviceFingerprint.getComponents()
            }
        };
        
        return bbid;
    }
    
    saveBBID(bbid) {
        // Save to localStorage
        localStorage.setItem(`bbid_${bbid.fingerprint.raw.substring(0, 10)}`, JSON.stringify(bbid));
        return bbid;
    }
    
    loadBBID(fingerprintPrefix) {
        const bbidJson = localStorage.getItem(`bbid_${fingerprintPrefix}`);
        return bbidJson ? JSON.parse(bbidJson) : null;
    }
    
    exportBBID(bbid) {
        // Convert to JSON string
        const bbidJson = JSON.stringify(bbid, null, 2);
        
        // Create blob and download link
        const blob = new Blob([bbidJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bbid.metadata.name.replace(/\s+/g, '_')}.bbid`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    importBBID(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const bbid = JSON.parse(event.target.result);
                    
                    // Validate required fields
                    if (!bbid.version || !bbid.metadata || !bbid.fingerprint || 
                        !bbid.metadata.created || !bbid.metadata.name ||
                        !bbid.fingerprint.raw || !bbid.fingerprint.bbes) {
                        reject(new Error('Invalid BBID file format'));
                        return;
                    }
                    
                    // Update modified timestamp
                    bbid.metadata.modified = new Date().toISOString();
                    
                    // Save and return
                    this.saveBBID(bbid);
                    resolve(bbid);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
```

### 5.2 Generating QR Codes for BBID Transfer

BBID files can be represented as QR codes for easy transfer between devices:

```javascript
function generateBBIDQRCode(bbid, elementId) {
    // Create a simplified version with just essential data
    const qrData = {
        v: bbid.version,
        n: bbid.metadata.name,
        f: bbid.fingerprint.bbes.substring(0, 50) // First 50 chars of BBES fingerprint
    };
    
    // Convert to JSON and then to QR code
    const qrCodeData = JSON.stringify(qrData);
    
    // Use a QR code library to generate the code
    // Example with qrcode.js:
    // QRCode.toCanvas(document.getElementById(elementId), qrCodeData);
}
```

### 5.3 Haptic Representation

BBID fingerprints can be represented haptically for accessibility:

```javascript
function playBBIDHapticPattern(bbesFingerprint) {
    if (!window.navigator.vibrate) return false;
    
    const vibrationPattern = [];
    
    // Convert first 8 characters of BBES fingerprint to vibration pattern
    const sampleFingerprint = bbesFingerprint.substring(0, 8);
    
    for (let i = 0; i < sampleFingerprint.length; i++) {
        const char = sampleFingerprint[i];
        
        // Skip non-Braille characters
        if (char.charCodeAt(0) < 0x2800 || char.charCodeAt(0) > 0x28FF) continue;
        
        // Convert Braille to dot pattern
        const dotPattern = char.charCodeAt(0) - 0x2800;
        
        // For each of the 6 possible dots
        for (let dot = 0; dot < 6; dot++) {
            // Check if this dot is raised (1) or not (0)
            const isDotRaised = (dotPattern & (1 << dot)) !== 0;
            
            // Add to vibration pattern: 100ms if raised, 0ms if not
            vibrationPattern.push(isDotRaised ? 100 : 0);
            // Add pause between dots
            vibrationPattern.push(50);
        }
        
        // Add pause between characters
        vibrationPattern.push(200);
    }
    
    // Trigger vibration
    return window.navigator.vibrate(vibrationPattern);
}
```

## 6. Future Directions

### 6.1 Multi-Device Synchronization

Future versions of the BBID specification may include:

- Methods for linking multiple devices to a single identity
- Secure device-to-device communication protocols
- Cloud-based synchronization options with end-to-end encryption

### 6.2 Authentication Enhancements

The BBID approach can be extended with:

- Two-factor authentication using multiple devices
- Biometric integration (fingerprint, face recognition)
- Progressive security levels based on context and risk

### 6.3 Standardization

Efforts to standardize BBID include:

- Documentation and reference implementations
- Interoperability testing with different platforms
- Collaboration with accessibility and security organizations

## 7. References

1. BBES Specification (Braille Binary Encoding Standard)
2. Web Authentication API (WebAuthn)
3. Fingerprint.js (Browser Fingerprinting Library)
4. Web Content Accessibility Guidelines (WCAG) 2.2

## 8. License

This specification is provided under the [MIT License](https://opensource.org/licenses/MIT).

---

Copyright © 2025 Elevate Foundry. All rights reserved.
