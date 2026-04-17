import { useEffect, useRef, useState } from "react";
import { Play, X, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import step1Img from "@/assets/tutorial-step1.jpg";
import step2Img from "@/assets/tutorial-step2.jpg";
import step3Img from "@/assets/tutorial-step3.jpg";

export type TutorialItem = {
  id: string;
  step: string;
  title: string;
  description: string;
  meta: string;
  thumbnail: string;
  videoUrl?: string;
  featured?: boolean;
};

const DEMO_VIDEO_URL =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/demo-video.mp4";
const CAROUSEL_MUSIC_URL =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/carousel-music.mp3";
const MUSIC_VOLUME = 0.35;

const DEFAULT_ITEMS: TutorialItem[] = [
  {
    id: "demo",
    step: "START HERE",
    title: "Quick App Demo",
    description: "See how 1st Assist works in under a minute",
    meta: "01:00",
    thumbnail: step1Img,
    videoUrl: DEMO_VIDEO_URL,
    featured: true,
  },
  {
    id: "step-1",
    step: "STEP 1",
    title: "Create Your Profile",
    description: "Complete your profile and set your preferences",
    meta: "For Surgeons | 02:14",
    thumbnail: step1Img,
  },
  {
    id: "step-2",
    step: "STEP 2",
    title: "Start Your First Case",
    description: "Manage and organize your surgical cases",
    meta: "For Surgeons | 03:07",
    thumbnail: step2Img,
  },
  {
    id: "step-3",
    step: "STEP 3",
    title: "Track Your Outcomes",
    description: "Monitor and analyze your surgical performance",
    meta: "For Surgeons | 02:32",
    thumbnail: step3Img,
  },
];

// Seconds for ONE full set of cards to traverse — slower = more premium
const SCROLL_DURATION_SECONDS = 32;

interface TutorialCarouselProps {
  items?: TutorialItem[];
  onSelect?: (item: TutorialItem) => void;
}

export function TutorialCarousel({ items = DEFAULT_ITEMS, onSelect }: TutorialCarouselProps) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeVideo, setActiveVideo] = useState<TutorialItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const loopedItems = [...items, ...items];

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const handleTouchStart = () => setPaused(true);
  const handleTouchEnd = () => setPaused(false);

  const handleSelect = (item: TutorialItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    if (item.videoUrl) {
      setActiveVideo(item);
    }
  };

  return (
    <section
      aria-label="Tutorial videos"
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />

        {reducedMotion ? (
          <div
            role="region"
            aria-roledescription="carousel"
            tabIndex={0}
            className={cn(
              "flex gap-4 overflow-x-auto overflow-y-hidden py-3 px-1",
              "scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]",
              "[&::-webkit-scrollbar]:hidden",
            )}
          >
            {items.map((item) => (
              <Card key={item.id} item={item} onSelect={handleSelect} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden py-3">
            <div
              ref={trackRef}
              className="flex w-max gap-4 will-change-transform"
              style={{
                animation: `tutorial-marquee ${SCROLL_DURATION_SECONDS}s linear infinite`,
                animationPlayState: paused ? "paused" : "running",
              }}
              aria-roledescription="carousel"
              role="region"
            >
              {loopedItems.map((item, i) => (
                <Card
                  key={`${item.id}-${i}`}
                  item={item}
                  onSelect={handleSelect}
                  ariaHidden={i >= items.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tutorial-marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      {/* Fullscreen video modal */}
      {activeVideo?.videoUrl && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <video
            src={activeVideo.videoUrl}
            autoPlay
            playsInline
            controls
            muted={isMuted}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/70 transition-all"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={() => setActiveVideo(null)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/70 transition-all"
              aria-label="Close video"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium text-white/80 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              {activeVideo.title}
            </span>
          </div>
        </motion.div>
      )}
    </section>
  );
}

interface CardProps {
  item: TutorialItem;
  onSelect?: (item: TutorialItem) => void;
  ariaHidden?: boolean;
}

function Card({ item, onSelect, ariaHidden }: CardProps) {
  const featured = item.featured;
  return (
    <article
      role="group"
      aria-roledescription="slide"
      aria-label={`${item.step}: ${item.title}`}
      aria-hidden={ariaHidden || undefined}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-2xl",
        "w-[78vw] sm:w-[340px] md:w-[360px]",
        "max-w-[360px]",
        "bg-card transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        featured
          ? [
              "border-2 border-primary/70",
              "shadow-[0_0_25px_-5px_hsl(var(--primary)/0.45)]",
              "hover:border-primary",
              "hover:shadow-[0_15px_50px_-10px_hsl(var(--primary)/0.6)]",
            ]
          : [
              "border border-border/60",
              "hover:border-primary/60",
              "hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.4)]",
            ],
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        tabIndex={ariaHidden ? -1 : 0}
        className="block w-full text-left"
        aria-label={`Play ${item.title} video`}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            width={768}
            height={512}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />

          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] backdrop-blur-md",
              featured
                ? "bg-primary text-primary-foreground border border-primary"
                : "border border-primary/40 bg-background/70 text-primary",
            )}
          >
            {item.step}
          </span>

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "flex items-center justify-center rounded-full",
                "bg-primary/90 text-primary-foreground",
                "transition-transform duration-300 group-hover:scale-110",
                featured
                  ? "h-16 w-16 shadow-[0_0_40px_-2px_hsl(var(--primary)/0.85)]"
                  : "h-14 w-14 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)]",
              )}
            >
              <Play size={featured ? 26 : 22} className="ml-0.5 fill-current" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
          <p className="pt-2 text-[10px] font-medium tracking-wider text-primary/80">{item.meta}</p>
        </div>
      </button>
    </article>
  );
}

export default TutorialCarousel;
