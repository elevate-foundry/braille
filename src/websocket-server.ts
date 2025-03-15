/**
 * WebSocket Server for BrailleBuddy Fingerprinting System (BBES)
 * 
 * This server provides real-time updates of fingerprint data to connected clients.
 * It broadcasts fingerprint data whenever new fingerprints are generated or updated.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

// Store active connections
const clients = new Map<WebSocket, { id: string }>();

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle new WebSocket connections
wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  const id = Math.random().toString(36).substring(2, 10);
  clients.set(ws, { id });
  
  console.log(`[WebSocket] Client connected: ${id}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to BBES Fingerprint WebSocket',
    clientId: id
  }));
  
  // Handle incoming messages
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle fingerprint data
      if (data.type === 'fingerprint') {
        console.log(`[WebSocket] Received fingerprint from client ${id}`);
        
        // Broadcast to all clients
        broadcastFingerprint(data.fingerprint, id);
      }
      
      // Handle consent data
      if (data.type === 'consent') {
        console.log(`[WebSocket] Client ${id} consent status: ${data.consented}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected: ${id}`);
    clients.delete(ws);
  });
});

/**
 * Broadcast fingerprint data to all connected clients
 */
export function broadcastFingerprint(fingerprint: any, sourceId: string) {
  const message = JSON.stringify({
    type: 'fingerprint',
    fingerprint,
    sourceId,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Handle HTTP server upgrade for WebSocket
 */
export function handleUpgrade(request: IncomingMessage, socket: any, head: Buffer) {
  const { pathname } = parse(request.url || '');
  
  // Only handle WebSocket connections to /ws/fingerprint
  if (pathname === '/ws/fingerprint') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
}

export default {
  wss,
  handleUpgrade,
  broadcastFingerprint
};
