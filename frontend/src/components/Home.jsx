import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import DriveInput from './DriveInput';
import Player from './Player';
import { Music4, Disc3, Radio, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export default function Home({ onSignOut, userProfile }) {
  const [playlist, setPlaylist] = useState([]);
  const [connectedLabel, setConnectedLabel] = useState('Waiting for a Drive link');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchDriveFiles = async (link) => {
    setConnectedLabel(link);
    setIsLoading(true);
    setError(null);

    try {
      // Calls your Express backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            driveUrl: link,
            accessToken: userProfile.googleAccessToken // 👈 ADD THIS
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlist');
      }

      setPlaylist(data.playlist);
    } catch (err) {
      setError(err.message);
      setPlaylist([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="music-shell"
    >
      <Header onSignOut={onSignOut} userProfile={userProfile} />

      <div className="music-grid music-grid--home">
        <section className="music-stack">
          <motion.div
            className="glass-panel hero-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.7 }}
          >
            <div className="hero-ambient" />
            <div className="hero-ambient hero-ambient--cyan" />

            <div className="pill-row">
              <span className="pill">Now playing space</span>
              <span className="pill pill--cyan">Drive synced</span>
            </div>

            <div className="hero-grid">
              <div>
                <p className="eyebrow">Cinematic music hub</p>
                <h1 className="hero-title">
                  Your library, dressed like a late-night studio.
                </h1>
                <p className="body-copy hero-copy">
                  Connect a Drive link, unlock the playlist, and keep the whole surface moody, minimal, and built around the track.
                </p>
              </div>

              <div className="hero-metrics">
                {[
                  { label: 'Mood', value: 'Warm / Neon' },
                  { label: 'Focus', value: 'Listening room' },
                  { label: 'Energy', value: 'Slow burn' },
                ].map((item) => (
                  <div key={item.label} className="metric-card">
                    <p className="metric-label">{item.label}</p>
                    <p className="metric-value">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="feature-grid">
            {[
              { icon: Music4, title: 'Curated flow', copy: 'Soft gradient surfaces and clear hierarchy.' },
              { icon: Disc3, title: 'Analog glow', copy: 'Gold accents anchor the interface without overpowering it.' },
              { icon: Radio, title: 'Live sync', copy: 'Drive-connected playlists feel immediate and playable.' },
            ].map((item, index) => (
              <motion.article
                key={item.title}
                className="glass-panel feature-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.55 }}
              >
                <div className="icon-badge">
                  <item.icon size={20} />
                </div>
                <h2 className="feature-title">{item.title}</h2>
                <p className="feature-copy">{item.copy}</p>
              </motion.article>
            ))}
          </div>

          <DriveInput onConnect={handleFetchDriveFiles} />

          <motion.section
            className="glass-panel status-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65 }}
          >
            <div className="panel-head">
              <div>
                <p className="eyebrow">Connection status</p>
                <h3 className="section-title">
                  {isLoading ? 'Syncing with Drive...' : 
                   error ? 'Connection Failed' :
                   playlist.length > 0 ? 'Playlist unlocked' : 'Waiting for your set'}
                </h3>
              </div>
              <div className="track-count">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 
                 error ? <AlertCircle size={16} color="#ff6b6b" /> :
                 playlist.length > 0 ? `${playlist.length} tracks` : 'Preview mode'}
              </div>
            </div>

            <p className="status-copy" style={{ color: error ? '#ff6b6b' : 'inherit' }}>
              {isLoading ? 'Decrypting folder contents and generating secure streaming links...' :
               error ? `Error: ${error}` :
               playlist.length > 0
                ? 'The player is live. Use the controls below to move through the set and keep the atmosphere consistent.'
                : 'Paste a Drive link to fetch your files and bring the player to life.'}
            </p>

            <div className="latest-link">
              <span className="latest-label">
                <Sparkles size={16} />
                Latest link
              </span>
              <span className="latest-link-value" title={connectedLabel}>
                {connectedLabel}
              </span>
            </div>
          </motion.section>
        </section>

        <section>
          <AnimatePresence mode="wait">
            {/* Only render the Player if we have a playlist and aren't actively loading */}
            {playlist.length > 0 && !isLoading && (
              <Player key={playlist.length} playlist={playlist} />
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.main>
  );
}