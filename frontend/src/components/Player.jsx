import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Waves,
  Disc3,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Radio,
  AlertCircle,
  Shuffle,
  Volume2,
  VolumeX,
  Volume1,
  Search,
  Gauge,
  X,
} from 'lucide-react';
import ReactPlayerModule from 'react-player';

const ReactPlayer = ReactPlayerModule?.default || ReactPlayerModule;

const PAGE_SIZE = 15;
const PLAYBACK_SPEEDS = [1.0, 1.25, 1.5, 0.8];

export default function Player({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queuePage, setQueuePage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [isPlaying, setIsPlaying] = useState(() => Boolean(playlist && playlist.length > 0));
  const [repeatOne, setRepeatOne] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const audioRef = useRef(null);
  const youtubeRef = useRef(null);
  const isTransitioningRef = useRef(false);

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
    const hasTracks = Boolean(playlist && playlist.length > 0);
    setIsPlaying(hasTracks);
    setIsAutoplayBlocked(false);
    setRepeatOne(false);
    setCurrentTime(0);
    setDuration(0);
  }, [playlist]);

  useEffect(() => {
    const currentPage = Math.floor(currentIndex / PAGE_SIZE);
    setQueuePage(currentPage);
  }, [currentIndex]);

  const filteredPlaylist = useMemo(() => {
    if (!queueSearch.trim()) {
      return playlist.map((track, originalIndex) => ({ ...track, originalIndex }));
    }
    const query = queueSearch.toLowerCase();
    return playlist
      .map((track, originalIndex) => ({ ...track, originalIndex }))
      .filter((track) => track.title.toLowerCase().includes(query));
  }, [playlist, queueSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPlaylist.length / PAGE_SIZE));
  const visiblePage = Math.min(queuePage, totalPages - 1);
  const pageStart = visiblePage * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const visibleTracks = filteredPlaylist.slice(pageStart, pageEnd);

  const getNextIndex = (prevIndex) => {
    if (playlist.length <= 1) return 0;
    if (isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * playlist.length);
      } while (randomIndex === prevIndex && playlist.length > 1);
      return randomIndex;
    }
    return prevIndex < playlist.length - 1 ? prevIndex + 1 : 0;
  };

  const handleNext = (startPlaying = true) => {
    isTransitioningRef.current = true;
    if (startPlaying) {
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
    }
    setCurrentIndex((prev) => getNextIndex(prev));
  };

  const handlePrev = (startPlaying = true) => {
    isTransitioningRef.current = true;
    if (startPlaying) {
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
    }
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const cyclePlaybackSpeed = () => {
    const nextIdx = (PLAYBACK_SPEEDS.indexOf(playbackSpeed) + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIdx]);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed, currentIndex]);

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

    const handlePlay = () => {
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
      isTransitioningRef.current = false;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const handlePause = () => {
      if (isTransitioningRef.current || audio.ended) {
        return;
      }
      if (audio.duration && audio.currentTime >= audio.duration - 0.5) {
        return;
      }
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    const handleCanPlay = () => {
      if (isPlaying && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn('Playback on canplay failed:', err);
            }
          });
        }
      }
    };

    const handleEnded = () => {
      if (repeatOne) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (autoPlay) {
        handleNext(true);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    if (repeatOne) {
      audio.loop = true;
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, playlist, repeatOne, isYouTubeTrack, autoPlay, isPlaying, isShuffle]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || isYouTubeTrack) {
      return;
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name === 'AbortError') {
            return;
          }
          if (error.name === 'NotAllowedError') {
            console.warn('Autoplay blocked by browser policy:', error);
            setIsAutoplayBlocked(true);
            setIsPlaying(false);
          } else {
            console.warn('Audio play request failed:', error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentIndex, playlist, isYouTubeTrack]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentIndex]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isYouTubeTrack && isPlaying) {
        const internalPlayer = youtubeRef.current?.getInternalPlayer?.();
        internalPlayer?.playVideo?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, isYouTubeTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) {
      return undefined;
    }

    const mediaSession = navigator.mediaSession;

    try {
      mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'Untitled Track',
        artist: trackArtist,
        album: 'Drive Music',
      });
    } catch {
      // MediaMetadata not supported
    }

    const play = () => {
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
      if (isYouTubeTrack) {
        youtubeRef.current?.getInternalPlayer?.()?.playVideo?.();
      } else if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    const pause = () => {
      setIsPlaying(false);
      if (isYouTubeTrack) {
        youtubeRef.current?.getInternalPlayer?.()?.pauseVideo?.();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    const next = () => handleNext(true);
    const previous = () => handlePrev(true);

    const actionHandlers = { play, pause, nexttrack: next, previoustrack: previous };

    Object.entries(actionHandlers).forEach(([action, handler]) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Media Session support differs between mobile browsers.
      }
    });

    return () => {
      ['play', 'pause', 'nexttrack', 'previoustrack'].forEach((action) => {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
          // Some browsers reject unsupported action handlers during cleanup.
        }
      });
    };
  }, [isYouTubeTrack, currentIndex, currentTrack, trackArtist, isShuffle]);

  const togglePlay = () => {
    setIsAutoplayBlocked(false);
    setIsPlaying(!isPlaying);
  };
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

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => !prev);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
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
            Paste a Drive or YouTube link to unlock the player. The set auto-starts and keeps moving from song to song automatically.
          </p>
          <div className="pill">
            <Waves size={14} />
            Waiting for signal
          </div>
        </div>
      </motion.div>
    );
  }

  const effectiveVolume = isMuted ? 0 : volume;

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
          <div className={`track-art ${isPlaying ? 'is-spinning' : ''}`} aria-hidden="true">
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
              <button
                type="button"
                className={`pill ${autoPlay ? 'pill--cyan' : ''}`}
                onClick={toggleAutoPlay}
                style={{ cursor: 'pointer' }}
                title="Click to toggle continuous autoplay"
              >
                {autoPlay ? 'Autoplay on' : 'Autoplay off'}
              </button>
              <button
                type="button"
                className={`pill ${isShuffle ? 'pill--gold' : ''}`}
                onClick={toggleShuffle}
                style={{ cursor: 'pointer' }}
                title="Click to toggle shuffle mode"
              >
                {isShuffle ? 'Shuffle on' : 'Shuffle off'}
              </button>
              <button
                type="button"
                className="pill pill--speed"
                onClick={cyclePlaybackSpeed}
                title="Click to change playback speed"
                style={{ cursor: 'pointer' }}
              >
                <Gauge size={12} />
                {playbackSpeed}x Speed
              </button>
            </div>
          </div>
        </div>

        {isAutoplayBlocked ? (
          <motion.button
            type="button"
            className="autoplay-blocked-banner"
            onClick={togglePlay}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={16} />
            <span>Browser paused initial sound. Click here or tap Play to start listening.</span>
          </motion.button>
        ) : null}

        <div className="waveform-shell" aria-label="Track waveform">
          <div className="waveform-label-row">
            <span className="subtle-label">Equalizer stream</span>
            <span className="waveform-state">{isPlaying ? 'live' : 'paused'}</span>
          </div>

          <div className="visualizer waveform-visualizer">
            {waveformBars.map((barHeight, index) => (
              <motion.div
                key={`${barHeight}-${index}`}
                className="visualizer-bar waveform-bar"
                style={{ height: `${barHeight}px` }}
                animate={isPlaying ? { scaleY: [0.65, 1.1, 0.78, 1] } : { scaleY: 0.35 }}
                transition={{ repeat: Infinity, duration: 1.1 + index * 0.04, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>

        <div className="now-card">
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
              type="button"
              className={`icon-button shuffle-button${isShuffle ? ' is-active' : ''}`}
              onClick={toggleShuffle}
              aria-pressed={isShuffle}
              aria-label="Toggle shuffle mode"
              title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
            >
              <Shuffle size={19} strokeWidth={1.8} />
            </button>

            <button
              className="icon-button"
              onClick={() => handlePrev(true)}
              type="button"
              title="Previous song"
              aria-label="Previous song"
            >
              <SkipBack size={22} strokeWidth={1.6} />
            </button>

            <motion.button
              className="play-button"
              onClick={togglePlay}
              whileTap={{ scale: 0.92 }}
              type="button"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPlaying ? <Pause size={26} color="#09090d" fill="#09090d" /> : <Play size={26} color="#09090d" fill="#09090d" className="ml-1" />}
              </div>
            </motion.button>

            <button
              className="icon-button"
              onClick={() => handleNext(true)}
              type="button"
              title="Next song"
              aria-label="Next song"
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
              <Repeat size={19} strokeWidth={1.8} />
              <span className="repeat-one-badge">1</span>
            </button>
          </div>

          <div className="secondary-controls-row">
            <div
              className="volume-widget-wrap"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                type="button"
                className="volume-icon-button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || effectiveVolume === 0 ? (
                  <VolumeX size={18} />
                ) : effectiveVolume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <div className={`volume-slider-shell ${showVolumeSlider ? 'is-visible' : ''}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={effectiveVolume}
                  onChange={(e) => {
                    const nextVol = Number(e.target.value);
                    setVolume(nextVol);
                    if (isMuted && nextVol > 0) {
                      setIsMuted(false);
                    }
                  }}
                  className="volume-range"
                  aria-label="Volume control"
                />
                <span className="volume-label-text">{Math.round(effectiveVolume * 100)}%</span>
              </div>
            </div>

            <button
              type="button"
              className={`autoplay-pill-button${autoPlay ? ' is-active' : ''}`}
              onClick={toggleAutoPlay}
              title="Continuous autoplay"
            >
              <Radio size={14} />
              <span>Autoplay</span>
            </button>
          </div>
        </div>

        <div className="queue-card">
          <div className="queue-header">
            <div>
              <p className="eyebrow">Queue & Tracklist</p>
              <p className="queue-subtitle">
                {filteredPlaylist.length} songs · page {visiblePage + 1} of {totalPages}
              </p>
            </div>

            <div className="queue-search-shell">
              <Search size={14} className="queue-search-icon" />
              <input
                type="text"
                className="queue-search-input"
                placeholder="Search queue..."
                value={queueSearch}
                onChange={(e) => {
                  setQueueSearch(e.target.value);
                  setQueuePage(0);
                }}
              />
              {queueSearch ? (
                <button
                  type="button"
                  className="queue-search-clear"
                  onClick={() => setQueueSearch('')}
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="queue-list">
            {visibleTracks.length > 0 ? (
              visibleTracks.map((track) => {
                const absoluteIndex = track.originalIndex;
                const isCurrent = absoluteIndex === currentIndex;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      isTransitioningRef.current = true;
                      setCurrentIndex(absoluteIndex);
                      setIsPlaying(true);
                      setIsAutoplayBlocked(false);
                    }}
                    className={`queue-button ${isCurrent ? 'is-active' : ''}`}
                  >
                    <span className="queue-track-title">{track.title}</span>
                    <span className="queue-number queue-track-index">
                      {isCurrent ? 'Live' : `${absoluteIndex + 1}`.padStart(3, '0')}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="queue-empty-search">
                <p>No tracks match "{queueSearch}"</p>
              </div>
            )}
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
        <div className="youtube-audio-host" aria-hidden="true">
          <ReactPlayer
            ref={youtubeRef}
            url={currentTrack.url}
            playing={isPlaying}
            volume={effectiveVolume}
            muted={isMuted}
            playbackRate={playbackSpeed}
            width="1px"
            height="1px"
            onDuration={(value) => setDuration(value || 0)}
            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds || 0)}
            onPlay={() => {
              setIsPlaying(true);
              setIsAutoplayBlocked(false);
              isTransitioningRef.current = false;
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
            }}
            onPause={() => {
              if ('mediaSession' in navigator && !isPlaying) {
                navigator.mediaSession.playbackState = 'paused';
              }
            }}
            onEnded={() => {
              if (repeatOne) {
                youtubeRef.current?.seekTo(0, 'seconds');
                youtubeRef.current?.getInternalPlayer?.()?.playVideo?.();
                return;
              }

              if (autoPlay) {
                handleNext(true);
              } else {
                setIsPlaying(false);
              }
            }}
            onReady={() => {
              if (isPlaying) {
                youtubeRef.current?.getInternalPlayer?.()?.playVideo?.();
              }
            }}
            onError={(err) => {
              console.warn('YouTube playback error:', err);
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  enablejsapi: 1,
                  modestbranding: 1,
                  origin: window.location.origin,
                  rel: 0,
                  playsinline: 1,
                },
              },
            }}
          />
        </div>
      ) : (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          autoPlay={isPlaying}
          preload="auto"
        />
      )}
    </motion.div>
  );
}