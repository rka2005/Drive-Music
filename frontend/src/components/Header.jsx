import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Music4 } from 'lucide-react';

export default function Header({ onSignOut, userProfile }) {
  const displayName = userProfile?.name || 'Signed in';
  const displayEmail = userProfile?.email || 'Music room is active';

  return (
    <motion.header
      className="glass-panel header-card"
      initial={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="brand-row">
        <div className="brand-mark">
          <Music4 size={22} />
        </div>

        <div>
          <p className="brand-subtitle">Aria studio</p>
          <h1 className="brand-name">Listen in color</h1>
        </div>
      </div>

      <div className="header-user-block">
        <div className="header-user-meta">
          <p className="header-user-name">{displayName}</p>
          <p className="header-user-email">{displayEmail}</p>
        </div>
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="signout-button"
          >
            <LogOut size={16} />
            Sign out
          </button>
        ) : null}
      </div>
    </motion.header>
  );
}