import { useEffect, useRef, useState, useCallback } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingVideo {
  id: string;
  step: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
}

const DEMO_VIDEO =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/demo-video.mp4";

const DEFAULT_VIDEOS: OnboardingVideo[] = [
  {
    id: "step-1",
    step: "STEP 1",
    title: "Create Your Profile",
    description: "Complete your profile and set your preferences",
    category: "For Surgeons",
    duration: "02:14",
    thumbnail: DEMO_VIDEO,
    videoUrl: DEMO_VIDEO,
  },
  {
    id: "step-2",
    step: "STEP 2",
    title: "Start Your First Case",
    description: "Manage and organize your surgical cases",
    category: "For Surgeons",
    duration: "03:07",
    thumbnail: DEMO_VIDEO,
    videoUrl: DEMO_VIDEO,
  },
  {
    id: "step-3",
    step: "STEP 3",
    title: "Track Your Outcomes",
    description: "Monitor and analyze your surgical performance",
    category: "For Surgeons",
    duration: "02:32",
    thumbnail: DEMO_VIDEO,
    videoUrl: DEMO_VIDEO,
  },
];

interface OnboardingVideoCarouselProps {
  videos?: OnboardingVideo[];
  onSelect?: (video: OnboardingVideo) => void;
  /** Pixels per second of auto-scroll. Default 30 = slow & elegant. */
  speed?: number;
}

export const OnboardingVideoCarousel = ({
  videos = DEFAULT_VIDEOS,
  onSelect,
  speed = 30,
}: OnboardingVideoCarouselProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Duplicate items for seamless loop
  const loopVideos = [...videos, ...videos];

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-scroll loop
  useEffect(() => {
    if (reducedMotion) return;
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const delta = ts - lastTsRef.current;
      lastTsRef.current = ts;

      if (!paused) {
        const halfWidth = track.scrollWidth / 2;
        const next = scroller.scrollLeft + (speed * delta) / 1000;
        if (next >= halfWidth) {
          scroller.scrollLeft = next - halfWidth;
        } else {
          scroller.scrollLeft = next;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [paused, reducedMotion, speed, videos.length]);

  // Track active index for pagination dots
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cardWidth = scroller.clientWidth * 0.82; // approx visible card width
    const idx = Math.round(scroller.scrollLeft / cardWidth) % videos.length;
    setActiveIndex(idx);
  }, [videos.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cardWidth = scroller.clientWidth * 0.82;
    scroller.scrollBy({ left: cardWidth * dir, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Onboarding tutorial videos"
      className="w-full mt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
    >
      <div className="relative">
        {/* Edge fades */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10 bg-gradient-to-r from-background to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-background to-transparent"
        />

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none" }}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
        >
          <div
            ref={trackRef}
            className="flex gap-4 px-1 py-3"
            style={{ width: "max-content" }}
          >
            {loopVideos.map((video, i) => (
              <VideoCard
                key={`${video.id}-${i}`}
                video={video}
                onClick={() => onSelect?.(video)}
              />
            ))}
          </div>
        </div>

        {/* Arrow controls (hidden on mobile) */}
        <button
          type="button"
          aria-label="Previous video"
          onClick={() => scrollByDir(-1)}
          className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-gold/30 text-gold hover:bg-black/80 hover:border-gold transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next video"
          onClick={() => scrollByDir(1)}
          className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-gold/30 text-gold hover:bg-black/80 hover:border-gold transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3" role="tablist">
        {videos.map((_, i) => (
          <span
            key={i}
            role="tab"
            aria-selected={activeIndex === i}
            aria-label={`Video ${i + 1}`}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              activeIndex === i ? "w-5 bg-gold" : "w-1.5 bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </section>
  );
};

interface VideoCardProps {
  video: OnboardingVideo;
  onClick: () => void;
}

const VideoCard = ({ video, onClick }: VideoCardProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Play ${video.title}`}
    className="group relative snap-center shrink-0 w-[82%] sm:w-[60%] md:w-[44%] lg:w-[32%] aspect-[16/10] rounded-2xl overflow-hidden border border-gold/20 bg-card text-left transition-all duration-300 hover:border-gold/60 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_hsl(var(--gold)/0.4)] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
  >
    {/* Looping video preview */}
    <video
      src={video.videoUrl ?? video.thumbnail}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
    />

    {/* Dark gradient overlay */}
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20"
    />
    {/* Subtle gold inner glow on hover */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-inset ring-gold/30 rounded-2xl"
    />

    {/* Content */}
    <div className="relative h-full flex flex-col justify-between p-3.5">
      {/* Top: step label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full uppercase">
          {video.step}
        </span>
      </div>

      {/* Center: play button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-11 h-11 rounded-full bg-gold/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Play size={16} className="text-primary-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>

      {/* Bottom: title, desc, meta */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
          {video.title}
        </h3>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {video.description}
        </p>
        <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground/80">
          <span>{video.category}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/60" />
          <span className="tabular-nums">{video.duration}</span>
        </div>
      </div>
    </div>
  </button>
);

export default OnboardingVideoCarousel;
