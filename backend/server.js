import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const parseFirebaseServiceAccount = () => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    try {
      if (rawServiceAccount.trim().endsWith('.json')) {
        const filePath = path.isAbsolute(rawServiceAccount)
          ? rawServiceAccount.trim()
          : path.resolve(currentDir, rawServiceAccount.trim());
        const fileContents = readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
      }

      return JSON.parse(rawServiceAccount);
    } catch (error) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      clientEmail,
      privateKey,
    };
  }

  return null;
};

const firebaseServiceAccount = parseFirebaseServiceAccount();

if (!admin.apps.length && firebaseServiceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
    projectId: firebaseServiceAccount.projectId,
  });
}

const firestoreDb = admin.apps.length ? admin.firestore() : null;

if (firestoreDb) {
  firestoreDb.settings({ ignoreUndefinedProperties: true });
}

const firestoreCollections = {
  stats: 'app_stats',
  users: 'users',
};

const getFirestoreConfigured = () => Boolean(firestoreDb);

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const extractGoogleIdToken = (req) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.slice(7).trim();
  }

  return req.body?.credential || req.body?.idToken || null;
};

const verifyGoogleIdentity = async (idToken) => {
  if (!idToken) {
    throw new Error('Google sign-in token is required.');
  }

  if (googleAuthClient) {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub) {
      throw new Error('Unable to verify Google identity token.');
    }

    return {
      uid: payload.sub,
      name: payload.name || payload.given_name || 'Google user',
      email: payload.email || '',
      picture: payload.picture || '',
      emailVerified: Boolean(payload.email_verified),
      credential: idToken,
    };
  }

  const payload = decodeJwtPayload(idToken);

  if (!payload?.sub) {
    throw new Error('Unable to decode Google identity token.');
  }

  return {
    uid: payload.sub,
    name: payload.name || payload.given_name || 'Google user',
    email: payload.email || '',
    picture: payload.picture || '',
    emailVerified: Boolean(payload.email_verified),
    credential: idToken,
  };
};

const serializeTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return value;
};

const serializeUserProfile = (profile) => ({
  uid: profile.uid,
  name: profile.name,
  email: profile.email,
  picture: profile.picture,
  provider: 'google',
  emailVerified: profile.emailVerified,
});

const upsertGoogleUser = async (profile, { countNewUser = false } = {}) => {
  if (!firestoreDb) {
    return {
      user: serializeUserProfile(profile),
      totalUsers: null,
      firestoreConfigured: false,
    };
  }

  const userRef = firestoreDb.collection(firestoreCollections.users).doc(profile.uid);
  const statsRef = firestoreDb.collection(firestoreCollections.stats).doc('overview');
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await firestoreDb.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists) {
      transaction.set(userRef, {
        ...serializeUserProfile(profile),
        createdAt: timestamp,
        lastSeenAt: timestamp,
        historyCount: 0,
      });

      if (countNewUser) {
        transaction.set(statsRef, {
          totalUsers: admin.firestore.FieldValue.increment(1),
          updatedAt: timestamp,
        }, { merge: true });
      }

      return;
    }

    transaction.set(userRef, {
      ...serializeUserProfile(profile),
      lastSeenAt: timestamp,
      updatedAt: timestamp,
    }, { merge: true });
  });

  const statsSnap = await statsRef.get().catch(() => null);
  const totalUsers = statsSnap?.data()?.totalUsers ?? null;

  return {
    user: serializeUserProfile(profile),
    totalUsers,
    firestoreConfigured: true,
  };
};

const recordHistoryEntry = async (profile, entry) => {
  if (!firestoreDb) {
    return null;
  }

  const userRef = firestoreDb.collection(firestoreCollections.users).doc(profile.uid);
  const historyRef = userRef.collection('history').doc();
  const recordedAt = new Date().toISOString();

  const historyEntry = {
    source: entry.source,
    sourceLabel: entry.sourceLabel,
    inputValue: entry.inputValue,
    playlistId: entry.playlistId || null,
    playlistTitle: entry.playlistTitle || entry.inputValue || '',
    trackCount: entry.trackCount || 0,
    trackPreview: entry.trackPreview || [],
    recordedAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await historyRef.set(historyEntry);

  await userRef.set({
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHistoryAt: admin.firestore.FieldValue.serverTimestamp(),
    historyCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    id: historyRef.id,
    ...historyEntry,
  };
};

const getUserHistory = async (profile, limit = 10) => {
  if (!firestoreDb) {
    return [];
  }

  const snapshot = await firestoreDb
    .collection(firestoreCollections.users)
    .doc(profile.uid)
    .collection('history')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt) || data.recordedAt || null,
    };
  });
};

const getTotalUsers = async () => {
  if (!firestoreDb) {
    return null;
  }

  const snapshot = await firestoreDb.collection(firestoreCollections.stats).doc('overview').get();
  return snapshot.data()?.totalUsers ?? 0;
};

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
      auth: '/api/auth/google',
      drivePlaylist: '/api/playlist',
      youtubePlaylist: '/api/youtube/playlist',
      history: '/api/history',
    }
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    firestoreConfigured: getFirestoreConfigured(),
  });
});

// Initialize Google Drive API client
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_FETCH_TIMEOUT_MS = Number(process.env.YOUTUBE_FETCH_TIMEOUT_MS || 15000);
const YOUTUBE_MAX_TRACKS = Math.max(1, Number(process.env.YOUTUBE_MAX_TRACKS || 200));
const YOUTUBE_PLAYLIST_CACHE_TTL_MS = Number(process.env.YOUTUBE_PLAYLIST_CACHE_TTL_MS || 0);
const youtubePlaylistCache = new Map();

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
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Accept direct playlist IDs as input.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const listValues = parsed.searchParams.getAll('list').filter(Boolean);
    const listId = listValues.length > 0 ? listValues[listValues.length - 1] : null;

    if (listId) {
      return listId.trim();
    }
  } catch {
    // Ignore URL parsing errors and fall back to regex parsing.
  }

  const matches = [...trimmed.matchAll(/(?:^|[?&])list=([a-zA-Z0-9_-]{10,})/g)];
  return matches.length ? matches[matches.length - 1][1] : null;
};

const getRequestBaseUrl = (req) => {
  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol)?.split(',')[0] || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = YOUTUBE_FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

app.post('/api/auth/google', async (req, res) => {
  try {
    const profile = await verifyGoogleIdentity(extractGoogleIdToken(req));
    const persistedUser = await upsertGoogleUser(profile, { countNewUser: true });
    const history = await getUserHistory(profile, 5);

    res.json({
      user: persistedUser.user,
      totalUsers: persistedUser.totalUsers ?? await getTotalUsers(),
      history,
      firestoreConfigured: persistedUser.firestoreConfigured,
    });
  } catch (error) {
    console.error('Google auth error:', error?.message || error);
    res.status(400).json({ error: error?.message || 'Failed to authenticate Google user.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const profile = await verifyGoogleIdentity(extractGoogleIdToken(req));
    const [history, totalUsers] = await Promise.all([
      getUserHistory(profile, 12),
      getTotalUsers(),
    ]);

    res.json({
      user: serializeUserProfile(profile),
      totalUsers,
      history,
      firestoreConfigured: getFirestoreConfigured(),
    });
  } catch (error) {
    console.error('History fetch error:', error?.message || error);
    res.status(400).json({ error: error?.message || 'Failed to load user history.' });
  }
});

const buildHistoryEntryPayload = (source, inputValue, extra = {}) => ({
  source,
  sourceLabel: source === 'youtube' ? 'YouTube' : 'Drive',
  inputValue,
  playlistId: extra.playlistId || null,
  playlistTitle: extra.playlistTitle || inputValue,
  trackCount: extra.trackCount || 0,
  trackPreview: extra.trackPreview || [],
});

// Drive Endpoint: Fetch Playlist
app.post('/api/playlist', async (req, res) => {
  try {
    const { driveUrl } = req.body;
    const profile = await verifyGoogleIdentity(extractGoogleIdToken(req));

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

    const historyEntry = await recordHistoryEntry(profile, buildHistoryEntryPayload('drive', driveUrl, {
      playlistTitle: driveUrl,
      trackCount: playlist.length,
      trackPreview: playlist.slice(0, 3).map((track) => track.title),
    }));

    res.json({ playlist, historyEntry });
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
    const profile = await verifyGoogleIdentity(extractGoogleIdToken(req));
    const youtubeApiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

    if (!youtubeApiKey) {
      return res.status(500).json({ error: 'Server misconfiguration: YOUTUBE_API_KEY (or GOOGLE_API_KEY) is missing.' });
    }

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'Please provide a YouTube playlist link.' });
    }

    const playlistId = extractYouTubePlaylistId(youtubeUrl);

    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid YouTube playlist link format.' });
    }

    const cacheEntry = YOUTUBE_PLAYLIST_CACHE_TTL_MS > 0 ? youtubePlaylistCache.get(playlistId) : null;

    if (cacheEntry && Date.now() - cacheEntry.createdAt < YOUTUBE_PLAYLIST_CACHE_TTL_MS) {
      return res.json({ playlist: cacheEntry.playlist, fromCache: true });
    }

    const collectedItems = [];
    let pageToken = undefined;

    do {
      const params = new URLSearchParams({
        part: 'snippet',
        fields: 'nextPageToken,items(snippet(title,resourceId/videoId,videoOwnerChannelTitle))',
        maxResults: '50',
        playlistId,
        key: youtubeApiKey,
      });

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetchWithTimeout(`${YOUTUBE_API_BASE}?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const reason = payload?.error?.message || 'YouTube API request failed.';
        throw new Error(reason);
      }

      const pageItems = payload.items || [];
      collectedItems.push(...pageItems);
      pageToken = payload.nextPageToken || undefined;
    } while (pageToken && collectedItems.length < YOUTUBE_MAX_TRACKS);

    const baseUrl = getRequestBaseUrl(req);
    const playlist = collectedItems
      .slice(0, YOUTUBE_MAX_TRACKS)
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
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean);

    if (playlist.length === 0) {
      return res.status(404).json({ error: 'No playable videos found in this YouTube playlist.' });
    }

    if (YOUTUBE_PLAYLIST_CACHE_TTL_MS > 0) {
      youtubePlaylistCache.set(playlistId, {
        createdAt: Date.now(),
        playlist,
      });
    }

    const historyEntry = await recordHistoryEntry(profile, buildHistoryEntryPayload('youtube', youtubeUrl, {
      playlistId,
      playlistTitle: youtubeUrl,
      trackCount: playlist.length,
      trackPreview: playlist.slice(0, 3).map((track) => track.title),
    }));

    res.json({ playlist, playlistId, truncated: collectedItems.length > YOUTUBE_MAX_TRACKS, historyEntry });
  } catch (error) {
    console.error('YouTube API Error:', error?.message || error);

    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'YouTube API request timed out. Please retry with a smaller playlist or try again.' });
    }

    res.status(500).json({ error: error?.message || 'Failed to fetch playlist from YouTube.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
