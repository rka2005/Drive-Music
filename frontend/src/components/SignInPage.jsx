import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Disc3,
  Headphones,
  LockKeyhole,
  Music4,
  Sparkles,
  Waves,
} from 'lucide-react';
import driveMusicLogo from '../assets/drive-music.jpeg';

const highlights = [
  { icon: Headphones, title: 'Private listening room', copy: 'A focused space built for personal playlists and late-night sessions.' },
  { icon: Waves, title: 'Cinematic wave motion', copy: 'Gradient bars and glow accents bring the music surface to life.' },
  { icon: Sparkles, title: 'Quick Drive access', copy: 'Jump from sign-in to playback with a minimal, fluid flow.' },
];

const steps = [
  'Sign in with Google to authorize your Drive music library.',
  'Paste a Drive folder link and let the app build the queue.',
  'Press play and keep your playlist moving with the built-in controls.',
];

export default function SignInPage({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const decodeJwtPayload = (token) => {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!googleClientId) {
      setGoogleError('Google sign-in is disabled. Add VITE_GOOGLE_CLIENT_ID in your .env file.');
      return () => {
        isMounted = false;
      };
    }

    const initializeGoogleButton = () => {
      if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      const viewportWidth = window.innerWidth || 360;
      const responsiveGoogleWidth = Math.min(360, Math.max(220, viewportWidth - 56));

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (!response?.credential) {
            setGoogleError('Google login failed. Please try again.');
            return;
          }

          const payload = decodeJwtPayload(response.credential);

          onSignIn?.({
            name: payload?.name,
            email: payload?.email,
            picture: payload?.picture,
            provider: 'google',
          });
        },
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: responsiveGoogleWidth,
      });

      if (isMounted) {
        setGoogleReady(true);
        setGoogleError('');
      }
    };

    const existingScript = document.querySelector('script[data-google-identity="true"]');

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogleButton();
      } else {
        existingScript.addEventListener('load', initializeGoogleButton, { once: true });
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = initializeGoogleButton;
      script.onerror = () => {
        if (isMounted) {
          setGoogleError('Unable to load Google sign-in right now.');
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId, onSignIn]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (email.trim() && password.trim()) {
      onSignIn?.({
        name: email.split('@')[0],
        email,
        provider: 'manual',
      });
    }
  };

  return (
    <main className="music-shell">
      <div className="music-grid music-grid--signin">
        <motion.section
          className="glass-panel sign-in-card sign-in-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-ambient" />
          <div className="hero-ambient hero-ambient--cyan" />

          <div className="sign-in-hero__glow" />

          <div className="sign-in-studio">
            <div className="hero-brand-block">
              <div className="brand-row brand-row--hero">
                <div className="brand-mark brand-mark--hero">
                  <img src={driveMusicLogo} alt="Drive Music logo" className="brand-logo-image" />
                </div>
                <div>
                  <p className="brand-subtitle">Drive Music</p>
                  <h1 className="signin-title">Stream your Drive music</h1>
                </div>
              </div>

              <div className="hero-badge-row">
                <span className="mini-chip">
                  <Music4 size={14} />
                  Music vibe
                </span>
                <span className="mini-chip mini-chip--cyan">
                  <Disc3 size={14} />
                  Personal playlist
                </span>
              </div>
            </div>

            <div className="sign-in-hero-copy">
              <p className="eyebrow">Cloud player access</p>
              <h2 className="section-title sign-in-heading">
                A music-first sign-in screen with neon rhythm and Drive sync.
              </h2>
              <p className="body-copy sign-in-copy">
                Connect your account, unlock the music library, and move straight into a cinematic player experience. The layout is tuned for desktop, tablet, and phones.
              </p>
            </div>

            <div className="sign-in-metrics">
              {[
                { label: 'Sync', value: 'Google Drive' },
                { label: 'Mode', value: 'Music flow' },
                { label: 'Feel', value: 'Dark neon' },
              ].map((item) => (
                <div key={item.label} className="sign-in-metric-card">
                  <p className="metric-label">{item.label}</p>
                  <p className="metric-value">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="sign-in-waveform" aria-hidden="true">
              {[12, 18, 24, 32, 46, 60, 74, 82, 70, 56, 40, 30, 22, 16, 20, 28, 38, 50, 42, 34, 26, 18].map((barHeight, index) => (
                <motion.span
                  key={`${barHeight}-${index}`}
                  className="sign-in-waveform__bar"
                  style={{ height: `${barHeight}px` }}
                  animate={
                    index % 2 === 0
                      ? { scaleY: [0.74, 1.06, 0.84, 1] }
                      : { scaleY: [0.62, 0.98, 0.78, 0.96] }
                  }
                  transition={{ repeat: Infinity, duration: 1.25 + index * 0.03, ease: 'easeInOut' }}
                />
              ))}
            </div>

            <div className="sign-in-features">
              {highlights.map((item, index) => (
                <motion.article
                  key={item.title}
                  className="glass-panel feature-card feature-card--signin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.08, duration: 0.55 }}
                >
                  <div className="icon-badge">
                    <item.icon size={18} />
                  </div>
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-copy">{item.copy}</p>
                </motion.article>
              ))}
            </div>

            <div className="steps-panel">
              <p className="field-caption">How it works</p>
              <div className="steps-list">
                {steps.map((step, index) => (
                  <div key={step} className="step-item">
                    <span className="step-number">0{index + 1}</span>
                    <p className="muted-line">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-panel sign-in-panel sign-in-auth"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-ambient" />
          <div className="hero-ambient hero-ambient--cyan" />

          <div className="signin-top signin-top--music">
            <div className="brand-row">
              <div className="icon-badge">
                <LockKeyhole size={18} />
              </div>
              <div>
                <p className="eyebrow">Secure access</p>
                <p className="muted-line" style={{ marginTop: 6 }}>Sign in to unlock your Drive-powered library.</p>
              </div>
            </div>

            <div className="mini-status">
              <Sparkles size={14} />
              Ready
            </div>
          </div>

          <form className="form-stack signin-stack" onSubmit={handleSubmit}>
            <div className="google-auth-block google-auth-block--featured">
              <span className="field-caption">Quick Access</span>
              <div ref={googleButtonRef} className="google-button-mount" />
              {!googleReady && !googleError ? <p className="muted-line">Loading Google sign-in...</p> : null}
              {googleError ? <p className="google-error">{googleError}</p> : <p className="muted-line">Use your Google account to authorize and start streaming in one tap.</p>}
            </div>

            <div className="auth-support-card">
              <p className="field-caption">What you get after sign-in</p>
              <div className="auth-support-list">
                <div className="auth-support-item">A queue built from your Drive music</div>
                <div className="auth-support-item">A neon player with repeat-one and controls</div>
                <div className="auth-support-item">Responsive music UI for phone, tablet, and desktop</div>
              </div>
            </div>

            <button type="submit" className="primary-button primary-button--signin">
              Start the session
              <ArrowRight size={16} />
            </button>

            <p className="muted-line sign-in-note">
              Your Drive music is ready when you are. Sign in to access playback, queues, and the full listening room.
            </p>
          </form>
        </motion.section>
      </div>
    </main>
  );
}