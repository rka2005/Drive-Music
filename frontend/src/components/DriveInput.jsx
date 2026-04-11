import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Music2, Sparkles } from 'lucide-react';

export default function DriveInput({ onConnect }) {
  const [driveLink, setDriveLink] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleConnect = (event) => {
    event.preventDefault();

    if (driveLink.trim() !== '') {
      onConnect(driveLink.trim());
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
            <h2 className="connect-title">Connect your Drive playlist</h2>
          </div>
        </div>

        <div className="mini-status">
          <Sparkles size={14} />
          Studio ready
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 18 }}>
        <label className="input-shell" style={{ flex: 1 }}>
          <Link2 size={18} color={isFocused ? '#f9e596' : '#8b8b99'} />

          <input 
            type="text" 
            className="text-field" 
            placeholder="Paste Drive link or folder URL"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </label>

        <button 
          type="submit"
          className="primary-button"
        >
          Load set
        </button>
      </div>
    </motion.form>
  );
}