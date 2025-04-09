/**
 * ADB Command Execution Server
 * 
 * This server receives ADB commands from the web interface and executes them
 * to send haptic feedback to the connected phone.
 */

import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Endpoint to execute ADB commands
app.post('/execute-adb-command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }
  
  console.log('Executing ADB command:', command);
  
  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
    }
    
    console.log(`Command stdout: ${stdout}`);
    
    // Return the result
    res.json({
      success: true,
      output: stdout || 'Command executed successfully',
      error: stderr || null
    });
  });
});

// Endpoint to check if a phone is connected via ADB
app.get('/check-phone-connection', (req, res) => {
  exec('adb devices', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error checking devices: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    
    const lines = stdout.trim().split('\n');
    
    // If there's only one line (the "List of devices attached" header), no devices are connected
    if (lines.length <= 1 || !lines[1].trim()) {
      return res.json({ connected: false });
    }
    
    // Parse the device list
    const devices = lines.slice(1).map(line => {
      const [id, status] = line.trim().split(/\s+/);
      return { id, status };
    }).filter(device => device.id && device.status);
    
    res.json({
      connected: devices.length > 0,
      devices
    });
  });
});

// Endpoint to execute a command using the symbios-watch-bridge.sh script
app.post('/execute-bridge-command', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }
  
  const scriptPath = path.join(__dirname, 'symbios-watch-bridge.sh');
  const fullCommand = `bash ${scriptPath} execute-adb "${command}"`;
  
  console.log('Executing bridge command:', fullCommand);
  
  exec(fullCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing bridge command: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    
    if (stderr) {
      console.error(`Bridge command stderr: ${stderr}`);
    }
    
    console.log(`Bridge command stdout: ${stdout}`);
    
    res.json({
      success: true,
      output: stdout || 'Bridge command executed successfully',
      error: stderr || null
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`ADB Command Server running at http://localhost:${PORT}`);
  console.log(`Make sure your phone is connected via USB with debugging enabled`);
});
