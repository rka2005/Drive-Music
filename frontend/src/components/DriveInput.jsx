import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Link2, Music2, PlayCircle, Sparkles, ClipboardPaste, X, Zap } from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: 'Lo-Fi Chill (YouTube)',
    source: 'youtube',
    link: 'https://www.youtube.com/playlist?list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5',
  },
  {
    label: 'Synthwave Beats (YouTube)',
    source: 'youtube',
    link: 'https://www.youtube.com/playlist?list=PLRBp0Fe2Gpgm0WF6DEGmb7ab4qCdqe9FQ',
  },
];

export default function DriveInput({
  onConnect,
  isLoading = false,
  source = 'drive',
  onSourceChange,
}) {
  const [playlistLink, setPlaylistLink] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState(false);

  const isYouTube = source === 'youtube';
  const heading = isYouTube ? 'Connect your YouTube playlist' : 'Connect your Drive playlist';
  const placeholder = isYouTube
    ? 'Paste YouTube playlist URL or ID (e.g. youtube.com/playlist?list=...)'
    : 'Paste Google Drive folder URL (e.g. drive.google.com/drive/folders/...)';

  const handleLinkChange = (value) => {
    setPlaylistLink(value);

    // Smart source auto-detection
    if (value.includes('youtube.com/playlist') || value.includes('youtu.be') || (value.includes('list=') && !value.includes('drive.google'))) {
      if (source !== 'youtube') {
        onSourceChange?.('youtube');
      }
    } else if (value.includes('drive.google.com')) {
      if (source !== 'drive') {
        onSourceChange?.('drive');
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const cleaned = text.trim();
        handleLinkChange(cleaned);
        setClipboardFeedback(true);
        setTimeout(() => setClipboardFeedback(false), 1800);
      }
    } catch {
      // Permission denied or clipboard empty
    }
  };

  const handleApplyPreset = (preset) => {
    onSourceChange?.(preset.source);
    setPlaylistLink(preset.link);
    onConnect({ source: preset.source, link: preset.link });
  };

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
      transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
    >
      <div className="connect-head">
        <div className="brand-row">
          <div className="icon-badge">
            <Music2 size={18} />
          </div>

          <div>
            <p className="eyebrow">Instant Sync</p>
            <h2 className="connect-title">{heading}</h2>
          </div>
        </div>

        <div className="mini-status">
          <Sparkles size={14} />
          Autoplay Ready
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
          Drive Mode
        </button>

        <button
          type="button"
          className={`source-toggle-button ${source === 'youtube' ? 'is-active' : ''}`}
          onClick={() => onSourceChange?.('youtube')}
          disabled={isLoading}
        >
          <PlayCircle size={16} />
          YouTube Mode
        </button>
      </div>

      <div className="form-row" style={{ marginTop: 18 }}>
        <div className={`input-shell ${isFocused ? 'is-focused' : ''}`} style={{ flex: 1 }}>
          <Link2 size={18} color={isFocused ? '#f9e596' : 'var(--text-muted, #8b8b99)'} />

          <input 
            type="text" 
            className="text-field" 
            placeholder={placeholder}
            value={playlistLink}
            onChange={(e) => handleLinkChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
          />

          {playlistLink ? (
            <button
              type="button"
              className="input-clear-button"
              onClick={() => setPlaylistLink('')}
              title="Clear input"
              aria-label="Clear input"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="paste-clipboard-button"
              onClick={handlePasteClipboard}
              title="Paste from clipboard"
              aria-label="Paste from clipboard"
            >
              <ClipboardPaste size={15} />
              <span>{clipboardFeedback ? 'Pasted!' : 'Paste'}</span>
            </button>
          )}
        </div>

        <button 
          type="submit" 
          className="primary-button"
          disabled={isLoading || !playlistLink.trim()}
        >
          {isLoading ? (
            <span className="button-spinner-wrap">
              <span className="button-spinner" />
              Loading...
            </span>
          ) : (
            <>
              <Zap size={16} />
              Load & Play
            </>
          )}
        </button>
      </div>

      <div className="preset-row">
        <span className="preset-label">Quick test:</span>
        <div className="preset-chips">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset-chip"
              onClick={() => handleApplyPreset(preset)}
              disabled={isLoading}
            >
              <PlayCircle size={13} />
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </motion.form>
  );
}