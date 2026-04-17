import { useState, useRef, useEffect, useCallback } from "react";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_VIDEO_URL =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/demo-video.mp4";
const DEMO_MUSIC_URL =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/demo-music.mp3";
const STORAGE_KEY = "hide_demo_popup";
const MUSIC_VOLUME = 0.18; // Soft background level
const FADE_DURATION = 1500; // ms for fade in/out

export const DemoVideoPopup = () => {
  const [open, setOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dontShow, setDontShow] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize background music
  useEffect(() => {
    const audio = new Audio(DEMO_MUSIC_URL);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    musicRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      musicRef.current = null;
    };
  }, []);

  // Fade music volume smoothly
  const fadeMusicTo = useCallback((targetVolume: number, onComplete?: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const music = musicRef.current;
    if (!music) return;

    const steps = 30;
    const stepDuration = FADE_DURATION / steps;
    const startVolume = music.volume;
    const delta = (targetVolume - startVolume) / steps;
    let step = 0;

    fadeIntervalRef.current = setInterval(() => {
      step++;
      music.volume = Math.max(0, Math.min(1, startVolume + delta * step));
      if (step >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        onComplete?.();
      }
    }, stepDuration);
  }, []);

  // Show popup after delay
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "true") {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync music with mute state
  useEffect(() => {
    const music = musicRef.current;
    if (!music || !open) return;

    if (!isMuted) {
      music.play().then(() => fadeMusicTo(MUSIC_VOLUME)).catch(() => {});
    } else {
      fadeMusicTo(0, () => music.pause());
    }
  }, [isMuted, open, fadeMusicTo]);

  const handleClose = useCallback(() => {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    // Fade out music before closing
    const music = musicRef.current;
    if (music && !music.paused) {
      fadeMusicTo(0, () => {
        music.pause();
        setOpen(false);
      });
    } else {
      setOpen(false);
    }
  }, [dontShow, fadeMusicTo]);

  const togglePlay = () => {
    const video = videoRef.current;
    const music = musicRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      if (music && !isMuted) music.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      if (music && !isMuted) music.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Backdrop — dark blur */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--card))] shadow-[0_0_80px_-20px_hsl(var(--gold)/0.15),0_25px_50px_-12px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Subtle gold glow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.5)] to-transparent" />

            {/* Header */}
            <div className="relative px-7 pt-6 pb-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--gold))] mb-1.5">
                  Welcome to First Assist
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Built for Precision. Designed for You.
                </h2>
              </motion.div>

              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-all duration-200"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Video container */}
            <motion.div
              className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Shimmer loader */}
              {!videoLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--muted))] to-[hsl(var(--card))] animate-pulse" />
              )}

              <video
                ref={videoRef}
                src={DEMO_VIDEO_URL}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onLoadedData={() => setVideoLoaded(true)}
                className="w-full aspect-video object-cover"
              />

              {/* Gradient overlay at bottom for controls */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              {/* Custom controls */}
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all duration-200"
                >
                  {isPlaying ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all duration-200"
                >
                  {isMuted ? <VolumeX size={14} strokeWidth={1.5} /> : <Volume2 size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </motion.div>

            {/* Footer */}
            <div className="flex items-center justify-between px-7 pb-5 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
                    dontShow
                      ? "bg-[hsl(var(--gold))] border-[hsl(var(--gold))]"
                      : "border-[hsl(var(--muted-foreground)/0.4)] group-hover:border-[hsl(var(--muted-foreground)/0.7)]"
                  }`}
                  onClick={() => setDontShow(!dontShow)}
                >
                  {dontShow && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="hsl(0,0%,8%)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200"
                  onClick={() => setDontShow(!dontShow)}
                >
                  Don't show this again
                </span>
              </label>

              <button
                onClick={handleClose}
                className="text-xs font-medium text-[hsl(var(--gold)/0.7)] hover:text-[hsl(var(--gold))] transition-colors duration-200"
              >
                Close
              </button>
            </div>

            {/* Bottom gold line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.2)] to-transparent" />

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
