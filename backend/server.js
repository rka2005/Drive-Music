import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// CORS configuration for production
const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
};

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
]
  .map(normalizeOrigin)
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const { hostname } = new URL(normalizedOrigin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Basic routes for Render browser checks and health probes
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'Drive Music Backend',
    status: 'ok',
    endpoints: {
      health: '/health',
      drivePlaylist: '/api/playlist',
      youtubePlaylist: '/api/youtube/playlist',
      youtubeAudio: '/api/youtube/audio/:videoId',
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

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/playlistItems';

// Helper function to extract Folder ID from a Drive URL
const extractFolderId = (url) => {
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  const genericMatch = url.match(/[-\w]{25,}/);
  return genericMatch ? genericMatch[0] : null;
};

const extractYouTubePlaylistId = (url) => {
  try {
    const parsed = new URL(url);
    const listId = parsed.searchParams.get('list');

    if (listId) {
      return listId.trim();
    }
  } catch {
    // Ignore URL parsing errors and fall back to regex parsing.
  }

  const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return listMatch?.[1] || null;
};

const getRequestBaseUrl = (req) => {
  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol)?.split(',')[0] || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

// Drive Endpoint: Fetch Playlist
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

    const playlist = files.map((file) => ({
      id: file.id,
      source: 'drive',
      title: file.name.replace(/\.[^/.]+$/, ''),
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

// YouTube Endpoint: Fetch Playlist Items
app.post('/api/youtube/playlist', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    if (!youtubeApiKey) {
      return res.status(500).json({ error: 'Server misconfiguration: YOUTUBE_API_KEY is missing.' });
    }

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'Please provide a YouTube playlist link.' });
    }

    const playlistId = extractYouTubePlaylistId(youtubeUrl);

    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid YouTube playlist link format.' });
    }

    const collectedItems = [];
    let pageToken = undefined;

    do {
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '50',
        playlistId,
        key: youtubeApiKey,
      });

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetch(`${YOUTUBE_API_BASE}?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        const reason = payload?.error?.message || 'YouTube API request failed.';
        throw new Error(reason);
      }

      const pageItems = payload.items || [];
      collectedItems.push(...pageItems);
      pageToken = payload.nextPageToken || undefined;
    } while (pageToken);

    const baseUrl = getRequestBaseUrl(req);
    const playlist = collectedItems
      .map((item, index) => {
        const videoId = item?.snippet?.resourceId?.videoId;
        const rawTitle = item?.snippet?.title || 'Untitled track';

        if (!videoId || rawTitle === 'Private video' || rawTitle === 'Deleted video') {
          return null;
        }

        return {
          id: `${videoId}-${index}`,
          source: 'youtube',
          videoId,
          title: rawTitle,
          artist: item?.snippet?.videoOwnerChannelTitle || 'YouTube',
          url: `${baseUrl}/api/youtube/audio/${videoId}`,
        };
      })
      .filter(Boolean);

    if (playlist.length === 0) {
      return res.status(404).json({ error: 'No playable videos found in this YouTube playlist.' });
    }

    res.json({ playlist });
  } catch (error) {
    console.error('YouTube API Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to fetch playlist from YouTube.' });
  }
});

// YouTube Endpoint: Stream audio as MP3
app.get('/api/youtube/audio/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !ytdl.validateID(videoId)) {
    return res.status(400).json({ error: 'Invalid YouTube video ID.' });
  }

  if (!ffmpegPath) {
    return res.status(500).json({ error: 'Server misconfiguration: ffmpeg is unavailable for MP3 streaming.' });
  }

  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const sourceStream = ytdl(youtubeWatchUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-store');

    const transcoder = ffmpeg(sourceStream)
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .format('mp3')
      .on('error', (streamError) => {
        console.error('YouTube audio stream error:', streamError.message);

        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream YouTube audio.' });
        } else {
          res.end();
        }
      });

    req.on('close', () => {
      sourceStream.destroy();
      transcoder.kill('SIGKILL');
    });

    transcoder.pipe(res, { end: true });
  } catch (error) {
    console.error('YouTube audio setup error:', error.message);
    res.status(500).json({ error: 'Unable to start YouTube audio stream.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
