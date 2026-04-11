import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Disc3, Headphones, LockKeyhole, Mail, Music4, Sparkles, Waves } from 'lucide-react';

const highlights = [
  { icon: Headphones, title: 'Private listening room', copy: 'A sign-in surface that feels more like a studio than a form.' },
  { icon: Waves, title: 'Soft waveform motion', copy: 'Gradients, depth, and light movement keep the screen alive.' },
  { icon: Sparkles, title: 'Drive-to-player flow', copy: 'Go from login to playback without leaving the visual rhythm.' },
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
        width: 360,
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
          className="glass-panel sign-in-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-ambient" />
          <div className="hero-ambient hero-ambient--cyan" />

          <div className="sign-in-studio">
            <div className="brand-row">
              <div className="brand-mark">
                <Music4 size={22} />
              </div>
              <div>
                <p className="brand-subtitle">Aria studio</p>
                <h1 className="signin-title">Sign in to the mix</h1>
              </div>
            </div>

            <div>
              <p className="eyebrow">Music vibe interface</p>
              <h2 className="section-title" style={{ marginTop: 16 }}>
                A listening room that feels warm, modern, and alive.
              </h2>
              <p className="body-copy sign-in-copy">
                This UI uses a dark cinematic palette, soft glow accents, and a direct sign-in flow so the app reads like a real music product instead of a template.
              </p>
            </div>

            <div className="sign-in-features">
              {highlights.map((item, index) => (
                <motion.article
                  key={item.title}
                  className="glass-panel feature-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.07, duration: 0.55 }}
                >
                  <div className="icon-badge">
                    <item.icon size={20} />
                  </div>
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-copy">{item.copy}</p>
                </motion.article>
              ))}
            </div>

            <div className="pill-row sign-in-footer">
              <span className="pill">Dark glow</span>
              <span className="pill pill--gold">Gold accent</span>
              <span className="pill pill--cyan">Neon edge</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-panel sign-in-panel"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-ambient" />
          <div className="hero-ambient hero-ambient--cyan" />

          <div className="signin-top">
            <div className="brand-row">
              <div className="icon-badge">
                <Disc3 size={18} />
              </div>
              <div>
                <p className="eyebrow">Secure access</p>
                <p className="muted-line" style={{ marginTop: 6 }}>Step into your personal listening space</p>
              </div>
            </div>

            <div className="mini-status">
              <Sparkles size={14} />
              Ready
            </div>
          </div>

          <form className="form-stack signin-stack" onSubmit={handleSubmit}>
            <div className="google-auth-block">
              <span className="field-caption">Quick Access</span>
              <div ref={googleButtonRef} className="google-button-mount" />
              {!googleReady && !googleError ? <p className="muted-line">Loading Google sign-in...</p> : null}
              {googleError ? <p className="google-error">{googleError}</p> : <p className="muted-line">Sign in instantly with your Google account.</p>}
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Enter by login with Google
              <ArrowRight size={16} />
            </button>

            <p className="muted-line">
              Your Drive music, ready to play the moment you enter. Sign in to access your Drive-powered music library.
            </p>
          </form>
        </motion.section>
      </div>
    </main>
  );
}