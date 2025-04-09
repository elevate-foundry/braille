import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;

// Serve static files
app.use(express.static(__dirname));

// Serve the Samsung Watch Visualizer
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'samsung-watch-visualizer.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Samsung Watch Visualizer server running at http://localhost:${PORT}`);
});
