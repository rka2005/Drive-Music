# Drive Playlist

Drive Playlist is a full-stack music web application that lets users connect a Google Drive folder, fetch audio files, and play them in a modern music-player interface.

This repository contains:
- `frontend`: React + Vite client application
- `backend`: Node.js + Express API service for Google Drive file discovery

## 1. Project Overview

Drive Playlist is designed to make personal cloud music libraries easy to play without manual file management.

Core idea:
- User signs in from the frontend
- User pastes a Google Drive folder link
- Backend fetches audio files from that folder
- Frontend renders a queue and streams tracks

## 2. End-to-End Workflow

### High-level flow
1. User opens the frontend app.
2. User signs in (Google sign-in available, manual form also exists in current code).
3. User pastes a Google Drive folder URL.
4. Frontend sends a POST request to backend `/api/playlist`.
5. Backend extracts folder ID and requests files from Google Drive API.
6. Backend filters to `audio/*` MIME types and paginates until all tracks are fetched.
7. Backend returns playlist JSON.
8. Frontend loads playlist into player and queue (15 tracks per page in queue view).

### Current integration note
Current code has a mismatch to be aware of:
- Frontend request includes `accessToken` in the request body.
- Backend currently authenticates Google Drive calls using `GOOGLE_API_KEY` only.

The app still works with API key-based backend flow, but if you want strict OAuth token flow, align frontend and backend auth modes.

## 3. Project Structure

```text
Drive_playlist/
├── README.md
├── frontend/
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── assets/
│       └── components/
│           ├── SignInPage.jsx
│           ├── Home.jsx
│           ├── Header.jsx
│           ├── DriveInput.jsx
│           └── Player.jsx
└── backend/
    ├── README.md
    ├── package.json
    ├── server.js
    ├── .env (local only)
    └── .gitignore
```

## 4. Tech Stack

### Frontend
- React 19
- Vite
- Framer Motion
- Lucide React
- TailwindCSS + PostCSS
- ESLint

### Backend
- Node.js
- Express
- googleapis
- cors
- dotenv

### Infrastructure
- Frontend deployment: Vercel
- Backend deployment: Render
- Source control: Git + GitHub

## 5. Key Features

- Google Drive folder ingestion for music files
- Audio-only filtering from Drive results
- Full pagination on backend (not limited to first page)
- Modern music-themed UI
- Player queue pagination (15 songs visible per page)
- Session persistence on frontend using `localStorage`
- Clear status and error feedback during fetch/playback flow

## 6. Components Breakdown (Frontend)

### `App.jsx`
- Root app shell
- Maintains authentication state
- Persists auth state to `localStorage`
- Switches between sign-in and home screens

### `SignInPage.jsx`
- Sign-in UI and intro panel
- Google Identity Services button rendering
- Manual email/password form currently present

### `Home.jsx`
- Main dashboard after sign-in
- Handles Drive link submission
- Calls backend `/api/playlist`
- Displays connection state, playlist status, and player section

### `DriveInput.jsx`
- Input form for Google Drive folder links
- Triggers playlist fetch callback

### `Player.jsx`
- Audio player controls
- Track queue rendering
- 15-item page navigation for large queues

### `Header.jsx`
- Top navigation and branding
- Signed-in profile summary
- Sign-out action

## 7. Backend Service Breakdown

### `server.js`
- Starts Express app and middleware
- Exposes `POST /api/playlist`
- Extracts Drive folder ID from incoming URL
- Uses Google Drive API to list files in folder
- Filters by `mimeType contains 'audio/'`
- Paginates through all file pages
- Returns normalized playlist objects

Response format:
```json
{
  "playlist": [
    {
      "id": "...",
      "title": "Track Name",
      "url": "https://www.googleapis.com/drive/v3/files/<id>?alt=media&key=<API_KEY>"
    }
  ]
}
```

## 8. Installation and Setup

## Prerequisites
- Node.js 18+
- npm 9+
- Google Cloud project with Drive API enabled

### 8.1 Clone Repository

```bash
git clone <your-repo-url>
cd Drive_playlist
```

### 8.2 Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
GOOGLE_API_KEY=your_google_api_key
```

Run backend:

```bash
npm run start
```

### 8.3 Frontend Setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BACKEND_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend local URL:
- `http://localhost:5173`

## 9. Environment Setup Summary

### Backend env vars
- `PORT`: API server port (default `5000`)
- `GOOGLE_API_KEY`: Google API key with Drive API enabled

### Frontend env vars
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID for sign-in
- `VITE_BACKEND_URL`: Base URL for backend API

## 10. Build and Deployment

### 10.1 Local Production Build

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

Backend:
```bash
cd backend
npm run start
```

### 10.2 Deploy Backend to Render

1. Push repository to GitHub.
2. Create a Render Web Service for `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars:
   - `PORT=5000`
   - `GOOGLE_API_KEY=<your_key>`
6. Deploy and copy the Render service URL.

### 10.3 Deploy Frontend to Vercel

1. Import repository in Vercel.
2. Set project root to `frontend` (if using monorepo config).
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env vars:
   - `VITE_GOOGLE_CLIENT_ID=<your_client_id>`
   - `VITE_BACKEND_URL=<your_render_backend_url>`
6. Deploy.

### 10.4 Post-deployment OAuth setup
In Google Cloud Console, add your deployed frontend domain to:
- Authorized JavaScript origins
- Authorized redirect URIs

## 11. Customization Guide

### UI theme
- Edit `frontend/src/App.css` for colors, spacing, panel styles, and motion tone.

### Branding text
- Update titles and labels in:
  - `frontend/src/components/Header.jsx`
  - `frontend/src/components/SignInPage.jsx`
  - `frontend/src/components/Home.jsx`

### Queue behavior
- Update queue page size in `frontend/src/components/Player.jsx`.

### API behavior
- Update filtering, sorting, or response mapping in `backend/server.js`.

## 12. User Manual

### Step-by-step use
1. Open the app URL.
2. Sign in from the sign-in page.
3. Paste a Google Drive folder link containing audio files.
4. Wait for playlist sync.
5. Start playback from the queue/player controls.
6. Navigate queue pages to browse all tracks.
7. Use sign-out when done.

### Best practices for users
- Keep Drive folder organized with clear filenames.
- Ensure shared folder permissions allow file access.
- Prefer stable network for smooth streaming.
- If no songs appear, verify folder contains audio MIME-type files.

## 13. Useful Tips

- Keep `frontend` and `backend` in separate terminals during local development.
- Store secrets only in `.env` files, never in code.
- If CORS errors appear, verify backend URL in frontend env.
- If Google login fails, re-check OAuth origins in Google Cloud settings.
- If songs do not play, verify backend stream URL generation and Drive permissions.
- Use frontend and backend READMEs for module-specific details:
  - `frontend/README.md`
  - `backend/README.md`

## 14. Troubleshooting Quick Reference

### Problem: API connection failed
- Check backend is running.
- Confirm `VITE_BACKEND_URL` is correct.

### Problem: No audio files found
- Ensure folder contains audio files.
- Ensure link points to folder, not file.

### Problem: Google sign-in issue
- Verify `VITE_GOOGLE_CLIENT_ID`.
- Verify allowed origins/redirect URIs.

### Problem: Playlist count seems incomplete
- Backend currently paginates all pages; check backend logs for Drive API errors.

## 15. Contact and Support

For issues, bugs, or feature requests:
- Open an issue in your GitHub repository Issues tab.
- Include:
  - error message
  - browser/version
  - reproduction steps
  - screenshots/logs when possible

Maintainer contact:
- Project Owner: update this section with your name/email
- Suggested format: `your-name <your-email@example.com>`

## 16. Roadmap Suggestions

- Fully align OAuth token-based flow between frontend and backend
- Add tests (unit + integration)
- Add API health endpoint
- Add playlist caching and retry strategy
- Add Docker support for one-command deployment

## 17. License

ISC
