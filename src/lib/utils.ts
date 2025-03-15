/**
 * Utility functions for the BrailleBuddy application
 */

/**
 * Get the client IP address from a request
 * This works with various request formats including Express and Next.js
 */
export function getClientIp(req: any): string | undefined {
  // Try various headers that might contain the client IP
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs
    // The first one is the original client IP
    return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0]).trim();
  }
  
  // Try other common headers
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // If we're using Express, the IP might be in the connection object
  if (req.connection) {
    return req.connection.remoteAddress;
  }
  
  // If we're using Socket.io, the IP might be in the handshake
  if (req.handshake) {
    return req.handshake.address;
  }
  
  // If we can't find an IP, return undefined
  return undefined;
}

/**
 * Generate a random ID with a specified length
 */
export function generateRandomId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format a date in a human-readable format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Safely parse JSON with a fallback value
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return fallback;
  }
}

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}
