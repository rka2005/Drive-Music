import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Waves, Disc3, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import ReactPlayer from 'react-player';

const PAGE_SIZE = 15;

export default function Player({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queuePage, setQueuePage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [repeatOne, setRepeatOne] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const youtubeRef = useRef(null);

  const currentTrack = playlist?.[currentIndex];
  const isYouTubeTrack = currentTrack?.source === 'youtube';
  const trackArtist = currentTrack?.artist || currentTrack?.owner || currentTrack?.album || (currentTrack?.source === 'youtube' ? 'YouTube track' : 'Google Drive track');
  const waveformBars = [12, 18, 24, 30, 46, 58, 42, 28, 20, 34, 52, 64, 48, 36, 26, 40, 56, 44, 28, 22, 30, 50, 38, 26];

  const formatTime = (value) => {
    if (!Number.isFinite(value) || value < 0) {
      return '0:00';
    }

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    setCurrentIndex(0);
    setQueuePage(0);
    setIsPlaying(true);
    setRepeatOne(false);
    setCurrentTime(0);
    setDuration(0);
  }, [playlist]);

  useEffect(() => {
    const currentPage = Math.floor(currentIndex / PAGE_SIZE);
    setQueuePage(currentPage);
  }, [currentIndex]);

  const totalPages = Math.max(1, Math.ceil(playlist.length / PAGE_SIZE));
  const visiblePage = Math.min(queuePage, totalPages - 1);
  const pageStart = visiblePage * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleTracks = playlist.slice(pageStart, pageEnd);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || isYouTubeTrack) {
      return undefined;
    }

    audio.loop = repeatOne;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      if (repeatOne) {
        return;
      }

      handleNext();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (repeatOne) {
      audio.loop = true;
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, playlist, repeatOne, isYouTubeTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || isYouTubeTrack) {
      return;
    }

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentIndex, playlist, isYouTubeTrack]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentIndex]);

  const handleNext = () => setCurrentIndex(prev => (prev < playlist.length - 1 ? prev + 1 : 0));
  const handlePrev = () => setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  const togglePlay = () => setIsPlaying(!isPlaying);
  const handleQueueNextPage = () => setQueuePage(prev => Math.min(prev + 1, totalPages - 1));
  const handleQueuePrevPage = () => setQueuePage(prev => Math.max(prev - 1, 0));
  const handleSeek = (event) => {
    const value = Number(event.target.value);
    setCurrentTime(value);

    if (isYouTubeTrack && youtubeRef.current) {
      youtubeRef.current.seekTo(value, 'seconds');
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const toggleRepeatOne = () => {
    setRepeatOne((prev) => !prev);
  };

  if (!currentTrack) {
    return (
      <motion.div
        className="glass-panel player-card player-card--empty"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65 }}
      >
        <div className="hero-ambient" />
        <div className="empty-stage">
          <div className="icon-badge">
            <Disc3 size={36} />
          </div>
          <h2 className="empty-stage-title">No set loaded yet</h2>
          <p className="body-copy" style={{ maxWidth: '36ch' }}>
            Paste a Drive link to unlock the player. Once the playlist loads, the controls and track progress come alive here.
          </p>
          <div className="pill">
            <Waves size={14} />
            Waiting for signal
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="glass-panel player-card"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
    >
      <div className="hero-ambient" />
      <div className="hero-ambient hero-ambient--cyan" />

      <div className="player-empty">
        <div className="player-hero">
          <div className="track-art" aria-hidden="true">
            <div className="track-art__glow" />
            <Disc3 size={52} />
          </div>

          <div className="track-meta">
            <div className="player-headline">
              <div>
                <p className="eyebrow">Playing now</p>
                <h2 className="panel-title panel-title--track">{currentTrack.title}</h2>
              </div>

              <div className="track-count">
                Track {currentIndex + 1} / {playlist.length}
              </div>
            </div>

            <p className="track-subtitle">{trackArtist}</p>

            <div className="track-status-row">
              <span className={`pill pill--cyan ${isPlaying ? 'is-live' : ''}`}>
                {isPlaying ? 'Now streaming' : 'Paused'}
              </span>
              <span className="pill">{repeatOne ? 'Repeat one' : 'Repeat off'}</span>
            </div>
          </div>
        </div>

        <div className="waveform-shell" aria-label="Track waveform">
          <div className="waveform-label-row">
            <span className="subtle-label">Waveform</span>
            <span className="waveform-state">{isPlaying ? 'live' : 'paused'}</span>
          </div>

          <div className="visualizer waveform-visualizer">
          {waveformBars.map((barHeight, index) => (
            <motion.div
              key={`${barHeight}-${index}`}
              className="visualizer-bar waveform-bar"
              style={{ height: `${barHeight}px` }}
              animate={isPlaying ? { scaleY: [0.7, 1.05, 0.82, 1] } : { scaleY: 0.5 }}
              transition={{ repeat: Infinity, duration: 1.25 + index * 0.05, ease: 'easeInOut' }}
            />
          ))}
          </div>
        </div>

        <div className="now-card">
          <div className="track-row">
            <div className="icon-badge">
              <Disc3 size={18} />
            </div>
            <div>
              <p className="subtle-label">Listening room</p>
              <p className="section-copy">A soft gold tone with warm contrast and a clean playback surface.</p>
            </div>
          </div>

          <div className="seek-shell">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="seek-range"
            />
            <div className="time-row" style={{ marginTop: 12 }}>
              <span className="time-label">{formatTime(currentTime)}</span>
              <span className="time-label">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="transport-shell">
          <div className="control-row">
            <button 
              className="icon-button" 
              onClick={handlePrev}
              type="button"
            >
              <SkipBack size={22} strokeWidth={1.6} />
            </button>

            <motion.button 
              className="play-button"
              onClick={togglePlay}
              whileTap={{ scale: 0.92 }}
              type="button"
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPlaying ? <Pause size={24} color="#09090d" fill="#09090d" /> : <Play size={24} color="#09090d" fill="#09090d" className="ml-1" />}
              </div>
            </motion.button>

            <button 
              className="icon-button" 
              onClick={handleNext}
              type="button"
            >
              <SkipForward size={22} strokeWidth={1.6} />
            </button>

            <button
              type="button"
              className={`icon-button repeat-button${repeatOne ? ' is-active' : ''}`}
              onClick={toggleRepeatOne}
              aria-pressed={repeatOne}
              aria-label={repeatOne ? 'Disable repeat one' : 'Enable repeat one'}
              title={repeatOne ? 'Repeat one on' : 'Repeat one off'}
            >
              <Repeat size={20} strokeWidth={1.8} />
              <span className="repeat-one-badge">1</span>
            </button>
          </div>
        </div>

        <div className="queue-card">
          <div className="queue-header">
            <div>
              <p className="eyebrow">Queue</p>
              <p className="queue-subtitle">
                {playlist.length} songs total · page {visiblePage + 1} of {totalPages}
              </p>
            </div>
          </div>

          <div className="queue-list">
            {visibleTracks.map((track, index) => {
              const absoluteIndex = pageStart + index;

              return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(absoluteIndex);
                  setIsPlaying(true);
                }}
                className={`queue-button ${absoluteIndex === currentIndex ? 'is-active' : ''}`}
              >
                <span className="queue-track-title">{track.title}</span>
                <span className="queue-number queue-track-index">
                  {absoluteIndex === currentIndex ? 'Live' : `${absoluteIndex + 1}`.padStart(3, '0')}
                </span>
              </button>
              );
            })}
          </div>

          <div className="queue-page-controls queue-page-controls--bottom">
            <button
              type="button"
              className="queue-page-button"
              onClick={handleQueuePrevPage}
              disabled={visiblePage === 0}
            >
              <ChevronLeft size={16} />
              Previous 15
            </button>

            <button
              type="button"
              className="queue-page-button"
              onClick={handleQueueNextPage}
              disabled={visiblePage >= totalPages - 1}
            >
              Next 15
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isYouTubeTrack ? (
        <div style={{ width: 0, height: 0, overflow: 'hidden' }}>
          <ReactPlayer
            ref={youtubeRef}
            url={currentTrack.url}
            playing={isPlaying}
            width="0px"
            height="0px"
            onDuration={(value) => setDuration(value || 0)}
            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds || 0)}
            onEnded={() => {
              if (repeatOne) {
                youtubeRef.current?.seekTo(0, 'seconds');
                return;
              }

              handleNext();
            }}
            onError={() => setIsPlaying(false)}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                },
              },
            }}
          />
        </div>
      ) : (
        <audio ref={audioRef} src={currentTrack.url} preload="metadata" />
      )}
    </motion.div>
  );
}