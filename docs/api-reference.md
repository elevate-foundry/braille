# BBID API Reference

This document provides a comprehensive reference for the BBID API endpoints, with a focus on the behavioral fingerprinting functionality.

## Behavioral Fingerprinting Endpoint

### POST /api/behavioral-fingerprint

Generates a behavioral fingerprint based on user interaction data collected by the `BBIDBehavioral` class.

#### Request

```json
{
  "deviceId": "string",
  "keyboardMetrics": {
    "keyPressCount": "number",
    "keyPressIntervals": "array",
    "keyHoldDurations": "array",
    "keyCodes": "object",
    "specialKeyUsage": "object",
    "averageTypingSpeed": "number",
    "errorRate": "number",
    "rhythmPatterns": "array"
  },
  "mouseMetrics": {
    "clickCount": "number",
    "moveCount": "number",
    "positions": "array",
    "trajectories": "array",
    "speeds": "array",
    "accelerations": "array",
    "clickPositions": "array",
    "clickDurations": "array",
    "doubleClickCount": "number",
    "dragEvents": "array",
    "hoverDurations": "object",
    "averageSpeed": "number",
    "clickHeatmap": "object",
    "movementPrecision": "number"
  },
  "touchMetrics": {
    "touchCount": "number",
    "touchPositions": "array",
    "touchAreas": "array",
    "pressures": "array",
    "swipeDirections": "array",
    "swipeSpeeds": "array",
    "swipeLengths": "array",
    "pinchEvents": "array",
    "multiTouchEvents": "number",
    "tapDurations": "array",
    "doubleTapCount": "number",
    "touchPrecision": "number",
    "averagePressure": "number",
    "averageTouchArea": "number"
  },
  "motionMetrics": {
    "orientationSamples": "array",
    "accelerationSamples": "array",
    "rotationSamples": "array",
    "orientationChanges": "number",
    "tiltAngles": "array",
    "shakingEvents": "number",
    "steadinessScores": "array",
    "averageTilt": "number",
    "stability": "number",
    "motionIntensity": "array"
  },
  "scrollPatterns": {
    "scrollEvents": "number",
    "scrollDirectionChanges": "number",
    "scrollPositions": "array",
    "scrollSpeeds": "array",
    "scrollAccelerations": "array",
    "scrollPauses": "array",
    "scrollDistances": "array",
    "scrollDepthPercentage": "number"
  },
  "formInteractions": {
    "focusEvents": "number",
    "blurEvents": "number",
    "formFields": "object",
    "completionTime": "object",
    "correctionCount": "object",
    "fieldSwitchingPattern": "array",
    "hesitationTimes": "object",
    "autoCompleteUsage": "number",
    "validationErrors": "object",
    "submissionAttempts": "number"
  },
  "uiInteractions": {
    "tabSwitches": "number",
    "backButtonUsage": "number",
    "shortcutUsage": "object",
    "navigationPatterns": "array",
    "interactionAreas": "object",
    "interactionDensity": "object",
    "interactionGaps": "array",
    "copyPasteEvents": "number",
    "rightClickEvents": "number"
  },
  "sessionMetrics": {
    "timeOfDay": "number",
    "dayOfWeek": "number",
    "timezone": "string",
    "language": "string",
    "screenSize": "string",
    "colorDepth": "number",
    "devicePixelRatio": "number",
    "connectionType": "string",
    "sessionStartTime": "number",
    "pageLoadTime": "number",
    "previousSessions": "number"
  },
  "timeOnPage": {
    "totalTime": "number",
    "activeTime": "number",
    "idlePeriods": "array",
    "focusPeriods": "array",
    "longestActivePeriod": "number"
  },
  "interactionFlow": "array"
}
```

#### Response

```json
{
  "success": true,
  "bbidFingerprint": "string",
  "confidenceScore": "number",
  "deviceType": "string",
  "behavioralCluster": "string",
  "uniquenessScore": "number"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "string"
}
```

## Implementation Example

```javascript
// Initialize behavioral tracking
const behavioral = new BBIDBehavioral({
  apiEndpoint: '/api/behavioral-fingerprint',
  deviceId: 'existing-device-fingerprint',
  onFingerprintGenerated: (fingerprint) => {
    console.log('Behavioral fingerprint generated:', fingerprint);
    // Update UI or store fingerprint
  }
});

// Start tracking
behavioral.start();

// Later, stop tracking
behavioral.stop();
```

## Behavioral Metrics Weighting

The API uses a sophisticated algorithm to weight different behavioral metrics based on their uniqueness and consistency. The weighting factors include:

- **Consistency**: How consistent the metric is across sessions for the same user
- **Uniqueness**: How unique the metric is across different users
- **Device Relevance**: How relevant the metric is for the specific device type
- **Sample Size**: How many samples were collected for the metric

## Cross-Device Fingerprinting

The behavioral fingerprinting API supports cross-device fingerprinting by:

1. Identifying common behavioral patterns across different devices
2. Matching behavioral clusters between devices
3. Correlating usage patterns and session metrics

## Privacy and Compliance

The API is designed to be privacy-friendly and compliant with regulations:

- No personal information is collected
- All data is anonymized
- Only behavioral patterns are analyzed, not content
- Users should be informed about the data collection
- Implementation should include clear consent mechanisms

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- Maximum 10 requests per minute per IP
- Maximum 1000 requests per day per IP
- Burst allowance of 20 requests

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Missing required parameters |
| 401  | Unauthorized - Invalid API key |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| 1.0.0   | 2024-01-01 | Initial release |
| 1.1.0   | 2024-02-15 | Added motion metrics |
| 1.2.0   | 2024-03-13 | Enhanced UI interaction tracking and session metrics |
