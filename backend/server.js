import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json()); // Parses JSON bodies

// Initialize Google Drive API client
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

// Helper function to extract Folder ID from a Drive URL
const extractFolderId = (url) => {
  // Matches standard Google Drive IDs (usually 33 alphanumeric characters)
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

// Main Endpoint: Fetch Playlist
app.post('/api/playlist', async (req, res) => {
  try {
    const { driveUrl } = req.body;

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
          q: `'${folderId}' in parents and mimeType contains 'audio/' and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType)',
          orderBy: 'name_natural',
          pageSize: 1000,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives',
        });

        collectedFiles.push(...(response.data.files ?? []));
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return collectedFiles;
    };

    const files = await fetchAllFiles();

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
    console.error('Drive API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch files from Google Drive.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});