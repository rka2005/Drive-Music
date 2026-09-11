import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import DriveInput from './DriveInput';
import Loader from './Loader';
import Player from './Player';
import HistorySidebar from './HistorySidebar';
import { Music4, Disc3, Radio, Sparkles, AlertCircle } from 'lucide-react';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Home({ onSignOut, userProfile, theme, onToggleTheme }) {
  const [playlist, setPlaylist] = useState([]);
  const [source, setSource] = useState('drive');
  const [connectedLabel, setConnectedLabel] = useState('Waiting for a Drive link');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [supportsHistory, setSupportsHistory] = useState(null);
  const authToken = userProfile?.credential;
  const sourceLabel = source === 'youtube' ? 'YouTube' : 'Drive';

  useEffect(() => {
    const loadHistory = async () => {
      if (!authToken) {
        setHistoryItems([]);
        return;
      }

      if (supportsHistory === null) {
        return;
      }

      if (supportsHistory === false) {
        setHistoryItems([]);
        return;
      }

      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await fetch(`${getBackendUrl()}/api/history`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load history');
        }

        setHistoryItems(Array.isArray(data.history) ? data.history : []);
      } catch (loadError) {
        setHistoryError(loadError.message);
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [authToken, supportsHistory]);

  useEffect(() => {
    const probeBackendCapabilities = async () => {
      if (!authToken) {
        return;
      }

      try {
        const response = await fetch(`${getBackendUrl()}/`);
        const data = await response.json();
        const hasHistoryRoute = Boolean(data?.endpoints?.history);

        setSupportsHistory(hasHistoryRoute);
      } catch {
        setSupportsHistory(false);
      }
    };

    probeBackendCapabilities();
  }, [authToken]);

  const syncHistoryEntry = (historyEntry) => {
    if (!historyEntry) {
      return;
    }

    setHistoryItems((currentHistory) => {
      const nextHistory = [historyEntry, ...currentHistory.filter((item) => item.id !== historyEntry.id)];
      return nextHistory.slice(0, 12);
    });
  };

  const handleFetchPlaylist = async ({ source: selectedSource, link }) => {
    const nextSource = selectedSource || source;
    const isYouTube = nextSource === 'youtube';

    setSource(nextSource);
    setConnectedLabel(link);
    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const endpoint = isYouTube ? '/api/youtube/playlist' : '/api/playlist';
      const payload = isYouTube
        ? { youtubeUrl: link }
        : { driveUrl: link };

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlist');
      }

      setPlaylist(data.playlist || []);
      syncHistoryEntry(data.historyEntry);
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
      <Header
        onSignOut={onSignOut}
        userProfile={userProfile}
        onHistoryToggle={() => setIsHistoryOpen((previousValue) => !previousValue)}
        isHistoryOpen={isHistoryOpen}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <AnimatePresence>
        {isHistoryOpen ? (
          <motion.button
            type="button"
            className="history-backdrop"
            aria-label="Close history"
            onClick={() => setIsHistoryOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>

      <HistorySidebar
        historyItems={historyItems}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(false)}
        isLoading={historyLoading}
        error={historyError}
        userProfile={userProfile}
        onSelectHistory={({ source: selectedSource, link }) => {
          setIsHistoryOpen(false);
          handleFetchPlaylist({ source: selectedSource, link });
        }}
      />

      <div className="music-grid music-grid--home">
        <section className="music-stack music-stack--main">
          <motion.div
            className="glass-panel hero-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.7 }}
          >
            <div className="hero-ambient" />
            <div className="hero-ambient hero-ambient--cyan" />

            <div className="pill-row">
              <span className="pill pill--gold">
                <Sparkles size={13} />
                Cloud Audio Player
              </span>
              <span className="pill pill--cyan">{sourceLabel} Stream</span>
              {playlist.length > 0 ? (
                <span className="pill is-live">● Live ({playlist.length} tracks)</span>
              ) : null}
            </div>

            <div className="hero-content-wrap">
              <h1 className="hero-title">
                Stream without limits.
              </h1>
              <p className="body-copy hero-copy">
                Drop in any public Google Drive music folder or YouTube playlist link. It auto-starts instantly and plays through the whole set without interruptions.
              </p>

              <div className="hero-badges">
                <span className="feature-badge">📁 Drive MP3/WAV/FLAC</span>
                <span className="feature-badge">▶️ YouTube Sets</span>
                <span className="feature-badge">⚡ Auto-start & Flow</span>
                <span className="feature-badge">📱 Background Audio</span>
              </div>
            </div>
          </motion.div>

          <DriveInput
            onConnect={handleFetchPlaylist}
            isLoading={isLoading}
            source={source}
            onSourceChange={(nextSource) => {
              setSource(nextSource);
              setConnectedLabel(nextSource === 'youtube' ? 'Waiting for a YouTube playlist link' : 'Waiting for a Drive link');
              setPlaylist([]);
              setError(null);
            }}
          />

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
                  {isLoading ? `Syncing with ${sourceLabel}...` :
                   error ? 'Connection Failed' :
                   playlist.length > 0 ? 'Playlist unlocked' : 'Waiting for your set'}
                </h3>
              </div>
              <div className="track-count">
                {isLoading ? <span className="track-count__loading-text">Loading</span> :
                 error ? <AlertCircle size={16} color="#ff6b6b" /> :
                 playlist.length > 0 ? `${playlist.length} tracks` : 'Preview mode'}
              </div>
            </div>

            <p className="status-copy" style={{ color: error ? '#ff6b6b' : 'inherit' }}>
              {isLoading ? `Fetching ${sourceLabel} playlist and preparing streaming links...` :
               error ? `Error: ${error}` :
               playlist.length > 0
                ? 'The player is live. Use the controls below to move through the set and keep the atmosphere consistent.'
                : `Paste a ${sourceLabel} playlist link to fetch your files and bring the player to life.`}
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
            {isLoading ? (
              <Loader
                key="playlist-loader"
                compact
                message={`Fetching tracks from ${sourceLabel}`}
                submessage="Resolving playlist entries and preparing audio playback..."
                className="player-loading-shell"
              />
            ) : (
              <Player key={`${source}-${playlist[0]?.id || 'empty'}-${playlist.length}`} playlist={playlist} />
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.main>
  );
}
