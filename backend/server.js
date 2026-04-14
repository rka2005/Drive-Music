import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://localhost:5173', // Vite dev server
  process.env.FRONTEND_URL || 'http://localhost:3000' // Production Vercel URL
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions)); // Allows your React app to talk to this server
app.use(express.json()); // Parses JSON bodies

// Basic routes for Render browser checks and health probes
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'Drive Music Backend',
    status: 'ok',
    endpoints: {
      health: '/health',
      playlist: '/api/playlist'
    }
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize Google Drive API client
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

// Helper function to extract Folder ID from a Drive URL
const extractFolderId = (url) => {
  // Prefer explicit folder URL shape, then fall back to generic ID matching.
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  const genericMatch = url.match(/[-\w]{25,}/);
  return genericMatch ? genericMatch[0] : null;
};

// Main Endpoint: Fetch Playlist
app.post('/api/playlist', async (req, res) => {
  try {
    const { driveUrl } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GOOGLE_API_KEY is missing.' });
    }

    if (!driveUrl) {
      return res.status(400).json({ error: 'Please provide a Google Drive folder link.' });
    }

    const folderId = extractFolderId(driveUrl);

    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive link format.' });
    }

    const fetchAllFiles = async () => {
      const collectedFiles = [];
      let pageToken = undefined;

      do {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType)',
          orderBy: 'name_natural',
          pageSize: 1000,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        collectedFiles.push(...(response.data.files ?? []));
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return collectedFiles;
    };

    const files = (await fetchAllFiles()).filter((file) => file.mimeType?.startsWith('audio/'));

    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'No audio files found in this folder.' });
    }

    // Format the data for the React frontend
    const playlist = files.map((file) => ({
      id: file.id,
      title: file.name.replace(/\.[^/.]+$/, ""), // Removes the file extension (e.g., .mp3) for a cleaner UI
      // This is the secret sauce: an API-level direct stream link
      url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${process.env.GOOGLE_API_KEY}`
    }));

    res.json({ playlist });

  } catch (error) {
    const driveError = error?.response?.data?.error;
    console.error('Drive API Error:', driveError || error.message);

    if (driveError?.code === 400) {
      return res.status(400).json({
        error: 'Google Drive rejected this folder request. Check that the URL is a folder link and the folder is accessible.',
      });
    }

    res.status(500).json({ error: 'Failed to fetch files from Google Drive.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});