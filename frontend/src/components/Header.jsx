import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import driveMusicLogo from '../assets/drive-music.jpeg';

export default function Header({ onSignOut, userProfile }) {
  const displayName = userProfile?.name || 'Signed in';
  const displayEmail = userProfile?.email || 'Music room is active';
  const avatarInitial = (displayName.trim().charAt(0) || 'A').toUpperCase();
  const [isUserCardOpen, setIsUserCardOpen] = React.useState(false);
  const userIdentityRef = React.useRef(null);

  React.useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!userIdentityRef.current?.contains(event.target)) {
        setIsUserCardOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, []);

  return (
    <motion.header
      className="glass-panel header-card"
      initial={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="brand-row">
        <div className="brand-mark">
          <img src={driveMusicLogo} alt="Drive Music logo" className="brand-logo-image" />
        </div>

        <div>
          <p className="brand-subtitle">Aria studio</p>
          <h1 className="brand-name">Listen in color</h1>
        </div>
      </div>

      <div className="header-user-block">
        <div
          ref={userIdentityRef}
          className={`header-user-identity${isUserCardOpen ? ' is-open' : ''}`}
        >
          <button
            type="button"
            className="header-user-avatar"
            aria-label="Open profile details"
            aria-expanded={isUserCardOpen}
            onClick={() => setIsUserCardOpen((prev) => !prev)}
          >
            {avatarInitial}
          </button>
          <div className="header-user-meta">
            <p className="header-user-name">{displayName}</p>
            <p className="header-user-email">{displayEmail}</p>
          </div>
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