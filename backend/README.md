# Drive Playlist Backend

```text

                        ┌───────────────────────────────────────────────────────────┐
                        │                                                           │
                        │            █████╗ ██████╗ ██╗ █████╗                      │
                        │           ██╔══██╗██╔══██╗██║██╔══██╗                     │
                        │           ███████║██████╔╝██║███████║                     │
                        │           ██╔══██║██╔══██╗██║██╔══██║                     │
                        │           ██║  ██║██║  ██║██║██║  ██║                     │
                        │           ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝                     │
                        │                                                           │
                        │   ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗           │
                        │   ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗          │
                        │   ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║          │
                        │   ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║          │
                        │   ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝          │
                        │   ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝           │
                        │                                                           │
                        │    Creative Design • UI/UX • Branding • Studio            │
                        │                                                           │
                        └───────────────────────────────────────────────────────────┘

```

A lightweight Express server that bridges your React frontend with Google Drive and YouTube playlist APIs. It fetches and normalizes playlist metadata, then returns track lists the frontend can play.

---

## 📋 Overview

The backend serves a critical purpose: **fetch playlist metadata from Drive folders and YouTube playlists, then return normalized track objects to the frontend**.

### Key Features
- 🎵 **Audio File Filtering**: Automatically detects and lists only audio files (`mimeType contains 'audio/'`)
- 📄 **Full Pagination Support**: Handles folders with hundreds or thousands of files seamlessly
- 🚗 **Shared Drives Ready**: Works with both personal and shared Google Drive folders
- ⚡ **API-Key Direct Streaming**: Generates secure, API-key-authenticated direct streaming URLs
- 🔍 **Natural Sorting**: Sorts files alphabetically for a predictable playlist order
- ▶️ **YouTube Playlist Discovery**: Fetches playlist items via YouTube Data API v3
- 🔒 **CORS Enabled**: Safely communicates with your React frontend

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Express.js** | Lightweight web server framework |
| **googleapis** | Official Google APIs Node.js client library |
| **YouTube Data API v3 (HTTP)** | YouTube playlist metadata fetch |
| **cors** | Cross-Origin Resource Sharing middleware |
| **dotenv** | Environment variable management |

### Node Version
- **Node.js** 18+ recommended
- **npm** 9+

---

## 🚀 Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend` directory:

```env
PORT=5000
GOOGLE_API_KEY=your_google_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_MAX_TRACKS=200
YOUTUBE_FETCH_TIMEOUT_MS=15000
YOUTUBE_PLAYLIST_CACHE_TTL_MS=600000
```

### 3. Obtain Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Drive API**:
   - Navigate to APIs & Services → Library
   - Search for "Google Drive API"
   - Click Enable
4. Create an API Key:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the key and paste it in your `.env` file

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured `PORT`).

---

## 🔌 API Endpoints

### `POST /api/playlist`

Fetches all audio files from a Google Drive folder and returns a playlist with playable URLs.

**Request:**
```json
{
  "driveUrl": "https://drive.google.com/drive/folders/1ABC123XYZ..."
}
```

**Response (Success):**
```json
{
  "playlist": [
    {
      "id": "file_id_123",
      "title": "Song Title",
      "url": "https://www.googleapis.com/drive/v3/files/file_id_123?alt=media&key=YOUR_API_KEY"
    },
    {
      "id": "file_id_456",
      "title": "Another Song",
      "url": "https://www.googleapis.com/drive/v3/files/file_id_456?alt=media&key=YOUR_API_KEY"
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "No audio files found in this folder."
}
```

**Status Codes:**
- `200` – Success
- `400` – Invalid Drive URL or missing request data
- `404` – No audio files found in the folder
- `500` – Server error (usually API quota or auth failure)

### `POST /api/youtube/playlist`

Fetches all playable videos from a YouTube playlist URL and returns audio-ready tracks.

**Request:**
```json
{
   "youtubeUrl": "https://www.youtube.com/playlist?list=PLxxxxxxxxxxxx"
}
```

**Response (Success):**
```json
{
   "playlist": [
      {
         "id": "video_id-0",
         "source": "youtube",
         "videoId": "video_id",
         "title": "Track Title",
         "artist": "Channel Name",
         "url": "https://www.youtube.com/watch?v=video_id"
      }
   ]
}
```

---

## 🔄 Workflow

### How the Backend Works End-to-End

```
Frontend (React)
    ↓
    └─ User pastes Drive folder link
    └─ Frontend POSTs /api/playlist with driveUrl
         ↓
    Backend (Express)
    ├─ Extract folder ID from URL
    ├─ Call Google Drive API with:
    │  └─ Folder query (files in this folder)
    │  └─ Audio MIME type filter
    │  └─ Pagination loop (fetch all pages)
    ├─ Build media URLs with API key
    └─ Return JSON playlist
         ↓
    Frontend receives playlist
    ├─ Stores in state
    ├─ Displays queue (15 songs per page)
    └─ Streams audio via generated URLs
```

### Key Implementation Details

1. **Folder ID Extraction**
   - Regex pattern: `/[-\w]{25,}/`
   - Extracts the 33-character folder ID from the Drive URL

2. **Audio File Filtering**
   - Drive query: `mimeType contains 'audio/' and trashed = false`
   - Supported formats: MP3, M4A, WAV, FLAC, OGG, etc.

3. **Pagination**
   - Fetches up to 1000 files per API call
   - Loops until all pages are retrieved (no limit on total files)
   - `supportsAllDrives: true` enables shared drive support

4. **Media URLs**
   - Format: `https://www.googleapis.com/drive/v3/files/{FILE_ID}?alt=media&key={API_KEY}`
   - These URLs stream audio directly from Google Drive without downloading

---

## 📦 Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | Server port | `5000` |
| `GOOGLE_API_KEY` | **Yes** | Your Google Cloud API key | `AIzaSyD...` |
| `YOUTUBE_API_KEY` | Recommended | YouTube Data API v3 key (falls back to `GOOGLE_API_KEY`) | `AIzaSyD...` |
| `YOUTUBE_MAX_TRACKS` | No | Maximum YouTube tracks returned per request | `200` |
| `YOUTUBE_FETCH_TIMEOUT_MS` | No | YouTube API request timeout in milliseconds | `15000` |
| `YOUTUBE_PLAYLIST_CACHE_TTL_MS` | No | In-memory cache duration for YouTube playlist responses | `600000` |

### `.env` Template

```env
# Server Port (default: 5000)
PORT=5000

# Google Cloud API Key (REQUIRED)
# Get this from https://console.cloud.google.com/
GOOGLE_API_KEY=your_key_here_33_character_string

# YouTube Data API v3 Key (recommended)
YOUTUBE_API_KEY=your_youtube_data_api_key_here

# Optional YouTube playlist tuning
YOUTUBE_MAX_TRACKS=200
YOUTUBE_FETCH_TIMEOUT_MS=15000
YOUTUBE_PLAYLIST_CACHE_TTL_MS=600000
```

### `.env.example`

Keep a `.env.example` file in the repo (without secret values) so teammates can copy and fill it in:

```env
PORT=5000
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
YOUTUBE_MAX_TRACKS=200
YOUTUBE_FETCH_TIMEOUT_MS=15000
YOUTUBE_PLAYLIST_CACHE_TTL_MS=600000
```

---

## 🌐 Deployment on Render

### Prerequisites
- GitHub account with this repository pushed
- Render account (free tier available)

### Step-by-Step Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create a Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch (`main`)

3. **Configure Render Settings**
   - **Name**: `drive-playlist-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter+ for production)

4. **Add Environment Variables**
   - In Render dashboard, go to Settings → Environment
   - Add:
     ```
     PORT=5000
     GOOGLE_API_KEY=your_google_api_key
     ```
   - Click "Save"

5. **Deploy**
   - Render will automatically redeploy on any `main` branch push
   - Your backend will be available at: `https://your-service-name.onrender.com`

### Render Tips

- **Cold Starts**: Free tier instances spin down after 15 minutes of inactivity. The first request will take ~10 seconds.
- **Uptime**: Upgrade to Starter+ or higher for always-on uptime
- **Logs**: Use Render's "Logs" tab to debug issues
- **Auto-Deploy**: Disable if you want manual deployments

### Update Frontend with Production URL

Once deployed, update your frontend to point to the production backend:

In `frontend/src/components/Home.jsx`:
```javascript
// Before:
const response = await fetch('http://localhost:5000/api/playlist', {...})

// After:
const response = await fetch('https://your-service-name.onrender.com/api/playlist', {...})
```

---

## 🔧 Development Tips

### Test the Endpoint Locally

Use `curl` or Postman to test the `/api/playlist` endpoint:

```bash
curl -X POST http://localhost:5000/api/playlist \
  -H "Content-Type: application/json" \
  -d '{"driveUrl": "https://drive.google.com/drive/folders/YOUR_FOLDER_ID"}'
```

### Enable Debug Logging

Add this at the top of `server.js` to see detailed API calls:

```javascript
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20; // Increase if needed
```

### Common Issues & Fixes

| Issue | Cause | Solution |
|---|---|---|
| `ERR_INVALID_DRIVE_URL` | Malformed folder URL | Use full Drive folder URL: `https://drive.google.com/drive/folders/...` |
| `PERMISSION_DENIED` | API key is invalid or has no Drive API access | Re-generate API key and enable Google Drive API in Cloud Console |
| `Not Found` (404) | Folder ID doesn't exist or is private | Verify folder is shared/public and ID is correct |
| `QUOTA_EXCEEDED` | Hit API rate limit (1000 requests/100 seconds) | Wait a moment; cache results on frontend if possible |

### Increase Logging

Add error context in `server.js`:

```javascript
catch (error) {
  console.error('Drive API Error:', error.message);
  console.error('Full Error:', error); // Add this line for debugging
  res.status(500).json({ error: 'Failed to fetch files from Google Drive.' });
}
```

---

## 📊 Performance Considerations

### API Quota
Google Drive API has rate limits:
- **Default**: 1000 requests per 100 seconds per user
- **Per IP**: 10,000 requests per day

**Optimization:**
- Cache results on the frontend for repeated queries
- Fetch playlist once at app startup, not on every component render

### Response Times
- **First request**: 1–3 seconds (API call + file listing)
- **Subsequent requests**: < 500ms (if cached)
- **Large folders (1000+ files)**: 2–5 seconds (pagination adds time)

---

## 🚨 Security Best Practices

### DO:
✅ Keep `GOOGLE_API_KEY` in `.env` (never commit to Git)  
✅ Use `.gitignore` to exclude `.env`  
✅ Limit API key scope to Google Drive API only  
✅ Monitor API key usage in Google Cloud Console  
✅ Rotate API keys periodically  

### DON'T:
❌ Hardcode API key in source code  
❌ Expose API key in frontend (server-side only)  
❌ Share API key in screenshots or Slack messages  
❌ Use production API key for development  

---

## 📝 File Structure

```
backend/
├── server.js           # Main Express application
├── package.json        # Dependencies and scripts
├── .env                # Environment variables (NOT in Git)
├── .env.example        # Template for .env
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check if port 5000 is already in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process and retry
npm start
```

### Connection Refused from Frontend

- Ensure backend is running (`npm start`)
- Check `PORT` in `.env` matches frontend URL
- Verify CORS is enabled: `app.use(cors())`

### "Invalid Google Drive URL"

The URL must be in this format:
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

Not:
```
https://drive.google.com/open?id=...  # Old format, won't work
```

### "No Audio Files Found"

- Verify folder actually contains audio files
- Check file MIME types (must be `audio/*`)
- Ensure files are not trashed

### API Key Errors

- Regenerate API key in Google Cloud Console
- Verify Google Drive API is **enabled** (not just created)
- Check key restrictions aren't too strict

---

## 📚 Useful Resources

- [Google Drive API Docs](https://developers.google.com/drive/api/v3/about-sdk)
- [Express.js Guide](https://expressjs.com/)
- [Render Documentation](https://render.com/docs)
- [Audio MIME Types](https://en.wikipedia.org/wiki/Audio_file_format#MIME_types)

---

## 📄 License

ISC

---

## 🤝 Contributing

Found a bug or have a feature request? Feel free to open an issue or submit a pull request.

---

**Happy Streaming! 🎵**
