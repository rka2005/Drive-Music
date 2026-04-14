import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Disc3, Mail, Music4, Phone, Sparkles, Copyright } from 'lucide-react';

const contactLinks = [
  { icon: Mail, label: 'rohitadak0@gmail.com', href: 'mailto:rohitadak0@gmail.com' },
  { icon: Phone, label: '+91 8348765905', href: 'tel:+918348765905' },
];

const techStack = [
  { icon: Cloud, label: 'Google Drive API' },
  { icon: Disc3, label: 'React + Vite' },
  { icon: Sparkles, label: 'Framer Motion' },
];

const featureList = [
  'Queue-based playback',
  'Repeat-one control',
  'Responsive music UI',
];

export default function Footer() {
  return (
    <motion.footer
      className="glass-panel app-footer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="app-footer__brand">
        <div className="app-footer__mark">
          <Music4 size={16} />
        </div>
        <div>
          <p className="brand-subtitle">Drive Music</p>
          <p className="app-footer__copy">Stream your library, keep the queue moving, and enjoy a focused music experience with a clean neon interface.</p>
        </div>
      </div>

      <div className="app-footer__columns">
        <section className="app-footer__section" aria-label="Contacts">
          <h3 className="app-footer__heading">Contact</h3>
          <div className="app-footer__contacts" aria-label="Contact links">
            {contactLinks.map((item) => (
              <a key={item.label} className="app-footer__link" href={item.href}>
                <item.icon size={14} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="app-footer__section" aria-label="Tech stack">
          <h3 className="app-footer__heading">Tech Stack</h3>
          <div className="app-footer__pill-group">
            {techStack.map((item) => (
              <span key={item.label} className="app-footer__pill">
                <item.icon size={14} />
                {item.label}
              </span>
            ))}
          </div>
        </section>

        <section className="app-footer__section app-footer__section--features" aria-label="Features">
          <h3 className="app-footer__heading">Features</h3>
          <ul className="app-footer__feature-list">
            {featureList.map((item) => (
              <li key={item} className="app-footer__feature-item">
                <Sparkles size={13} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="app-footer__meta">
        <span className="app-footer__meta-item">Built for Drive-powered playback</span>
        <span className="app-footer__meta-item app-footer__meta-item--center">
          <Copyright size={14} />
          2026 Drive Music. All rights reserved.
        </span>
        <span className="app-footer__meta-item app-footer__meta-item--icon">
          <Music4 size={14} />
          Music-first interface
        </span>
      </div>
    </motion.footer>
  );
}