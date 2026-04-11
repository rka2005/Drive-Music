# Drive Playlist Frontend

A modern, visually stunning music player web app built with React and Vite. Stream songs directly from your Google Drive with a beautiful, cinematic dark UI, seamless Google OAuth sign-in, and queue pagination.

---

## 📋 Overview

This is a full-featured music streaming frontend that connects to a Google Drive folder and plays audio files. It features:

- 🎨 **Dark Cinematic UI** – Gold and cyan color accents, glass morphism panels, responsive design
- 🔐 **Google OAuth Sign-In** – One-click login with Drive read access
- 🎵 **Music Player** – Play/pause, seek bar, visualizer, volume control
- 📱 **Queue Management** – Paginate through songs (15 per page), next/previous navigation
- 💾 **Session Persistence** – Stay signed in across browser reloads
- 🚀 **Lightning Fast** – Built with Vite for instant dev reload and optimized production builds

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI component framework |
| **Vite** | Lightning-fast build tool and dev server |
| **Framer Motion** | Smooth animations and transitions |
| **Lucide React** | Beautiful icon library |
| **Tailwind CSS** | Utility-first styling (custom theme applied) |
| **PostCSS + Autoprefixer** | CSS processing and browser compatibility |
| **ESLint + Prettier** | Code quality and formatting |

### Browser Support
- Chrome 90+
- Firefox 87+
- Safari 14+
- Edge 90+

### Node Version
- **Node.js** 18+ recommended
- **npm** 9+

---

## 🚀 Quick Start

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Identity Services**:
   - Navigate to APIs & Services → Library
   - Search for "Google Identity Services"
   - Click Enable
4. Create OAuth 2.0 Credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Choose application type: **Web application**
   - Add authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     https://yourdomain.com
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:5173
     http://localhost:3000
     https://yourdomain.com
     ```
   - Copy the **Client ID** to your `.env.local`

### 4. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173` with hot module replacement enabled (instant reload on code changes).

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar with user info & sign-out
│   │   ├── SignInPage.jsx       # Google OAuth login screen
│   │   ├── Home.jsx             # Main dashboard & queue loader
│   │   ├── DriveInput.jsx       # Drive folder URL input form
│   │   └── Player.jsx           # Audio player with queue & controls
│   ├── App.jsx                  # Root component with auth state management
│   ├── App.css                  # Global music-themed styles
│   ├── index.css                # Base styles
│   ├── main.jsx                 # React entry point
│   └── assets/                  # Images, icons, etc.
├── public/                      # Static files
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS theme
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint rules
├── package.json                 # Dependencies & scripts
├── index.html                   # HTML template
└── README.md                    # This file
```

---

## 🧩 Component Breakdown

### `App.jsx`
**Purpose:** Root component and auth state manager

**Key Features:**
- Manages global auth state (`isSignedIn`, `userProfile`)
- Persists auth to `localStorage` so users stay signed in across reloads
- Routes between `SignInPage` and `Home` based on auth state
- Handles sign-in/sign-out callbacks

**State:**
```javascript
{
  isSignedIn: boolean,
  userProfile: {
    name: string,
    email: string,
    picture: string,
    googleAccessToken: string (for Drive API access)
  }
}
```

---

### `SignInPage.jsx`
**Purpose:** Login surface with Google OAuth

**Key Features:**
- Loads Google Identity Services script
- Initiates OAuth flow with Drive read scope
- Fetches user profile after successful auth
- Pass access token to App for backend use
- Beautiful animated sign-in card

**OAuth Scope:**
```
openid email profile https://www.googleapis.com/auth/drive.readonly
```

This grants permission to read user profile and access Drive files.

---

### `Home.jsx`
**Purpose:** Main dashboard and playlist loader

**Key Features:**
- Shows user info in header
- `DriveInput` component for pasting Drive folder URL
- Fetches playlist from backend via `/api/playlist` endpoint
- Displays status & summary cards
- Integrates `Player` component for playback
- Queue management and pagination setup

**Flow:**
1. User pastes Drive folder URL
2. Frontend POSTs to backend with URL + access token
3. Backend returns playlist array
4. Player displays songs in queue (15 per page)

---

### `DriveInput.jsx`
**Purpose:** Drive folder URL input form

**Key Features:**
- Text input for Google Drive folder link
- URL validation (basic pattern check)
- Submit button to fetch songs
- Loading/error state feedback
- Instructions for where to find share link

**Accepted URL Format:**
```
https://drive.google.com/drive/folders/1ABC123XYZ...
```

---

### `Player.jsx`
**Purpose:** Audio playback and queue control

**Key Features:**
- **Controls:** Play/pause, previous/next track, seek bar, volume
- **Queue Display:** Shows 15 songs per page with pagination
- **Current Track:** Displays playing song title and artist
- **Visualizer:** Animated bars sync to audio playback
- **Queue Navigation:** "Previous 15" and "Next 15" buttons
- **Progress Tracking:** Shows current time and total duration

**Queue Pagination:**
- Page size: 15 songs
- Auto-follows current track (always ensures playing song is visible)
- Smooth page transitions

---

### `Header.jsx`
**Purpose:** Top navigation branding and user controls

**Key Features:**
- App logo and title ("Drive Playlist")
- Displays current user name/email
- User profile picture
- Sign-out button
- Responsive design

---

## 🔄 Workflow

### User Journey

```
┌─────────────────────────────────────────┐
│  User visits app                        │
└─────────────────┬───────────────────────┘
                  │
                  ├─ Check localStorage for auth?
                  │
                  ├─ [YES] → Load Home
                  └─ [NO] → Load SignInPage
                           │
                           └─ Click "Continue with Google"
                              │
                              ├─ OAuth consent screen
                              ├─ Grant Drive read access
                              ├─ Fetch user profile
                              └─ Save to localStorage
                                 │
                                 └─ Redirect to Home
                                    │
                                    └─ Paste Drive folder URL
                                       │
                                       └─ POST to /api/playlist
                                          │
                                          ├─ Backend fetches songs
                                          └─ Return playlist
                                             │
                                             └─ Player displays queue
                                                │
                                                └─ Click play, enjoy music! 🎵
```

---

## 📦 Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `123456789.apps.googleusercontent.com` |
| `VITE_BACKEND_URL` | Backend API endpoint | `http://localhost:5000` |

### `.env.local` (Development)

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_BACKEND_URL=http://localhost:5000
```

### `.env.production` (Vercel)

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Template File (`.env.example`)

Keep this in the repo (without secrets) for reference:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🏗️ Build & Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

**Output:**
- HTML, CSS, JS bundles (minified)
- Asset hashing for cache busting
- Source maps for debugging (in development)

### Preview Production Build Locally

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build before deploying.

---

## 🌐 Deployment on Vercel

### Prerequisites
- GitHub account with repository pushed
- Vercel account (free tier available)

### Step-by-Step Deployment

#### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy frontend to Vercel"
git push origin main
```

#### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository and branch (`main`)

#### 3. Configure Vercel Settings

- **Project Name**: `drive-playlist` (or your choice)
- **Framework**: Detect automatically (should be Vite)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 4. Add Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add both variables:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`  
     **Value**: Your Google Client ID
   - **Name**: `VITE_BACKEND_URL`  
     **Value**: Your production backend URL (e.g., `https://backend.onrender.com`)

#### 5. Deploy

Click "Deploy" and Vercel will:
- Pull latest code from GitHub
- Install dependencies
- Build with `npm run build`
- Deploy the `dist/` folder to CDN

**Your app is live!** Vercel provides a URL like `https://drive-playlist.vercel.app`

### Update Google OAuth Origins

Add your Vercel URL to Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Select your project
3. APIs & Services → Credentials
4. Find your OAuth 2.0 Client ID
5. Add authorized origins:
   ```
   https://drive-playlist.vercel.app
   ```

### Auto-Deploy on Push

Vercel automatically redeploys whenever you push to `main`. To disable:
1. Settings → Git
2. Toggle "Automatic Deployments" off

---

## 🎨 Styling & Customization

### Theme Colors

Edit [src/App.css](src/App.css) to customize the music theme:

```css
/* Primary Colors */
--color-gold: #d4af37;
--color-cyan: #00d9ff;
--color-dark-bg: #0a0e27;
--color-panel-bg: rgba(255, 255, 255, 0.05);

/* Adjust these for a different vibe */
```

### Tailwind Config

Edit [tailwind.config.js](tailwind.config.js) for typography, spacing, and utility scale:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      fontFamily: {
        // Custom fonts
      }
    }
  }
}
```

### Responsive Breakpoints

Default Tailwind breakpoints (in App.css classes):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## ⚡ Performance Tips

### Dev Server Optimization

1. **Hot Module Replacement (HMR)** – Enabled by default, no config needed
2. **Lazy Loading** – Components load on-demand (built into React)

### Production Bundle Optimization

1. **Code Splitting** – Vite automatically chunks components
2. **Image Optimization** – Use optimized images (WebP when possible)
3. **CSS Purging** – Tailwind removes unused styles in production

### User Performance

- **Playlist Caching** – Don't re-fetch on every navigation
- **Queue Pagination** – Only render 15 songs at a time (not all 351+)
- **Audio Buffering** – Browser handles this automatically via `<audio>` tag

### Monitoring Performance

```bash
# Check bundle size
npm run build -- --report
```

---

## 🔧 Development Tips

### Hot Reload Development

```bash
npm run dev
```

Changes to React components, CSS, and assets reload instantly without page refresh.

### Linting

Check code quality:

```bash
npm run lint
```

### Debugging in Browser

1. Open DevTools (`F12`)
2. Check Console for errors
3. React DevTools extension (install from Chrome/Firefox store)
4. Check Application → Local Storage for auth state

**Inspect Auth State:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('drive-playlist-auth'))
```

### Common Issues & Fixes

| Issue | Cause | Solution |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID is not defined` | Missing `.env.local` file | Create file with correct variable name |
| Google login button doesn't appear | Script didn't load | Check browser console for CORS errors |
| "Failed to fetch playlist" | Backend URL is wrong | Verify `VITE_BACKEND_URL` in `.env.local` |
| Songs won't play | CORS issue with Drive URLs | Backend should use API key in media URLs |
| Slow page load | Large bundle size | Run `npm run build` and check bundle analysis |
| LocalStorage not persisting | Incognito/Private mode | Use normal browser mode for testing |

---

## 📊 Browser DevTools Tips

### Network Tab
- Check API calls to `/api/playlist`
- Verify media URLs return 206 Partial Content (stream support)
- Look for CORS errors

### Console Tab
- Google OAuth errors appear here first
- Watch for "ERR_BLOCKED_BY_CLIENT" (privacy tools blocking OAuth)

### Application Tab
- Check `localStorage` for auth state
- Inspect cookies (should be minimal)

---

## 🚨 Security Best Practices

### DO:
✅ Keep `VITE_GOOGLE_CLIENT_ID` in `.env.local` (not in Git)  
✅ Add `.env.local` to `.gitignore`  
✅ Use HTTPS in production (Vercel does this automatically)  
✅ Validate URLs before sending to backend  
✅ Trust backend to handle API keys (never expose API key in frontend)  

### DON'T:
❌ Hardcode secrets in source code  
❌ Commit `.env.local` to Git  
❌ Expose Google OAuth credentials  
❌ Use older Google Sign-In method  
❌ Store sensitive data in localStorage (only auth state)  

---

## 📚 Scripts Reference

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run lint` | Check code quality with ESLint |
| `npm run preview` | Preview production build locally |

---

## 📚 Useful Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Identity Services](https://developers.google.com/identity/protocols/oauth2/web-server)

---

## 🐛 Reporting Issues

Found a bug? Please include:
- Browser and version
- Error message from console
- Steps to reproduce
- Screenshot if visual issue

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

**Enjoy your music streaming! 🎵**
