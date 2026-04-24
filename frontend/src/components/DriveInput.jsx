import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Link2, Music2, PlayCircle, Sparkles } from 'lucide-react';

export default function DriveInput({
  onConnect,
  isLoading = false,
  source = 'drive',
  onSourceChange,
}) {
  const [playlistLink, setPlaylistLink] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isYouTube = source === 'youtube';
  const heading = isYouTube ? 'Connect your YouTube playlist' : 'Connect your Drive playlist';
  const placeholder = isYouTube
    ? 'Paste YouTube playlist URL'
    : 'Paste Google Drive folder URL';

  const handleConnect = (event) => {
    event.preventDefault();

    if (!isLoading && playlistLink.trim() !== '') {
      onConnect({ source, link: playlistLink.trim() });
    }
  };

  return (
    <motion.form 
      className="glass-panel form-card"
      onSubmit={handleConnect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
    >
      <div className="connect-head">
        <div className="brand-row">
          <div className="icon-badge">
            <Music2 size={18} />
          </div>

          <div>
            <p className="eyebrow">Library sync</p>
            <h2 className="connect-title">{heading}</h2>
          </div>
        </div>

        <div className="mini-status">
          <Sparkles size={14} />
          Studio ready
        </div>
      </div>

      <div className="source-toggle-row" role="tablist" aria-label="Playlist source">
        <button
          type="button"
          className={`source-toggle-button ${source === 'drive' ? 'is-active' : ''}`}
          onClick={() => onSourceChange?.('drive')}
          disabled={isLoading}
        >
          <HardDrive size={16} />
          Drive
        </button>

        <button
          type="button"
          className={`source-toggle-button ${source === 'youtube' ? 'is-active' : ''}`}
          onClick={() => onSourceChange?.('youtube')}
          disabled={isLoading}
        >
          <PlayCircle size={16} />
          YouTube
        </button>
      </div>

      <div className="form-row" style={{ marginTop: 18 }}>
        <label className="input-shell" style={{ flex: 1 }}>
          <Link2 size={18} color={isFocused ? '#f9e596' : '#8b8b99'} />

          <input 
            type="text" 
            className="text-field" 
            placeholder={placeholder}
            value={playlistLink}
            onChange={(e) => setPlaylistLink(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
          />
        </label>

        <button 
          type="submit"
          className="primary-button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load set'}
        </button>
      </div>
    </motion.form>
  );
}