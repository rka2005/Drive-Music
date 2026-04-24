# Production Setup Guide

This guide walks you through deploying the Drive Playlist app to Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub account with the repository pushed
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Google Cloud Console project with Drive API and OAuth credentials

## Backend Deployment (Render)

### Step 1: Prepare the Backend

1. Create a `.env` file in the `backend/` directory with:
   ```
   PORT=5000
   GOOGLE_API_KEY=your_google_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

2. Push the code to GitHub:
   ```bash
   git add .
   git commit -m "Production setup"
   git push
   ```

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Fill in the details:
   - **Name**: `drive-playlist-api` (or your preferred name)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Scroll down to "Environment Variables" and add:
   - `GOOGLE_API_KEY`: Your Google API key
   - `YOUTUBE_API_KEY`: Your YouTube Data API v3 key
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://drive-playlist.vercel.app`)
6. Click "Create Web Service"
7. Wait for the build to complete (takes ~2-3 minutes)
8. Copy the web service URL (e.g., `https://drive-playlist-api.onrender.com`)

## Frontend Deployment (Vercel)

### Step 1: Prepare the Frontend

1. Make sure `.env.production` or environment variables are configured with:
   ```
   VITE_BACKEND_URL=https://drive-playlist-api.onrender.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

2. Push to GitHub if not done already

### Step 2: Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Select your repository
4. Vercel will auto-detect it's a Vite project
5. In the deployment settings:
   - **Framework Preset**: Vue (select this for Vite)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Go to "Environment Variables" and add:
   - `VITE_BACKEND_URL`: `https://drive-playlist-api.onrender.com` (or your Render URL)
   - `VITE_GOOGLE_CLIENT_ID`: Your Google Client ID
7. Click "Deploy"
8. Wait for deployment to complete

## After Deployment

1. Test the frontend: Visit your Vercel deployment URL
2. Test the API: Use the backend URL with `/api/playlist` endpoint
3. Update your Google Cloud Console OAuth redirect URIs:
   - Add your Vercel URL (e.g., `https://drive-playlist.vercel.app`)
   - Keep `http://localhost:3000` for local development

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
- The `FRONTEND_URL` environment variable on Render is set to your Vercel URL
- The `VITE_BACKEND_URL` environment variable on Vercel is set to your Render URL

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure Node version compatibility (Node 18+ recommended)

### API 404 Errors
- Verify the backend is running on Render
- Check the backend URL is correct in frontend environment variables
- Ensure the `/api/playlist` route is properly configured

## Local Development with Production Backend

To test the frontend locally against the production backend:

1. Create a `frontend/.env.production.local` file:
   ```
   VITE_BACKEND_URL=https://drive-playlist-api.onrender.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

## Domain Configuration (Optional)

If you have a custom domain:

1. **Vercel**: Go to Project Settings > Domains and add your domain
2. **Render**: In your Web Service settings, add your domain under "Custom Domain"

## Security Notes

- Never commit `.env` files with real keys/secrets
- Use `.env.example` as a template for team members
- Rotate API keys periodically
- Keep secrets in Render and Vercel environment variables, not in code
