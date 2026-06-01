import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock3, History } from 'lucide-react';

const formatTimeLabel = (value) => {
  if (!value) {
    return 'Just now';
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
};

export default function HistorySidebar({
  historyItems = [],
  isOpen = true,
  onToggle,
  isLoading = false,
  error = '',
  userProfile,
}) {
  const displayName = userProfile?.name || 'Google listener';

  return (
    <motion.aside
      className={`glass-panel history-sidebar ${isOpen ? 'history-sidebar--open' : 'history-sidebar--closed'}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="history-sidebar__shell">
        <div className="history-sidebar__header">
          <div className="history-sidebar__title-wrap">
            <p className="eyebrow">History</p>
            <h2 className="history-sidebar__title">Left rail activity</h2>
          </div>

          <button
            type="button"
            className="history-sidebar__toggle"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse history sidebar' : 'Open history sidebar'}
            title={isOpen ? 'Collapse history' : 'Open history'}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <div className="history-sidebar__stats">
          <div className="history-sidebar__stat-card">
            <Clock3 size={16} />
            <span>Recent actions</span>
            <strong>{historyItems.length}</strong>
          </div>
        </div>

        <div className="history-sidebar__body">
          <div className="history-sidebar__section-head">
            <History size={16} />
            <span>Recent history</span>
          </div>

          {error ? <p className="history-sidebar__error">{error}</p> : null}

          {isLoading ? (
            <div className="history-sidebar__loading">Loading saved history...</div>
          ) : historyItems.length > 0 ? (
            <div className="history-sidebar__list">
              {historyItems.map((item) => (
                <article key={item.id} className="history-item">
                  <div className="history-item__meta">
                    <p className="history-item__source">{item.sourceLabel || (item.source === 'youtube' ? 'YouTube' : 'Drive')}</p>
                    <p className="history-item__time">{formatTimeLabel(item.createdAt || item.recordedAt)}</p>
                  </div>
                  <h3 className="history-item__title">{item.playlistTitle || item.inputValue}</h3>
                  <p className="history-item__details">
                    {Number.isFinite(item.trackCount) ? `${item.trackCount} tracks` : 'Saved session'}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-sidebar__empty">
              <p>No saved history yet.</p>
              <span>Load a playlist and the backend will store it here for this Google account.</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}