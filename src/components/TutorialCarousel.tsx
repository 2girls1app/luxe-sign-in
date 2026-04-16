import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
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
};

const DEFAULT_ITEMS: TutorialItem[] = [
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
const SCROLL_DURATION_SECONDS = 28;

interface TutorialCarouselProps {
  items?: TutorialItem[];
  onSelect?: (item: TutorialItem) => void;
}

export function TutorialCarousel({ items = DEFAULT_ITEMS, onSelect }: TutorialCarouselProps) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate the items once → seamless loop when we translate -50%
  const loopedItems = [...items, ...items];

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Touch handlers for mobile (no hover) — pause while touching
  const handleTouchStart = () => setPaused(true);
  const handleTouchEnd = () => setPaused(false);

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
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />

        {/* Reduced motion: native horizontal scroll instead of marquee */}
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
              <Card key={item.id} item={item} onSelect={onSelect} />
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
                  onSelect={onSelect}
                  ariaHidden={i >= items.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Marquee keyframes — translate exactly -50% so the duplicated set lines up seamlessly */}
      <style>{`
        @keyframes tutorial-marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </section>
  );
}

interface CardProps {
  item: TutorialItem;
  onSelect?: (item: TutorialItem) => void;
  ariaHidden?: boolean;
}

function Card({ item, onSelect, ariaHidden }: CardProps) {
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
        "border border-border/60 bg-card",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-primary/60",
        "hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.4)]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        tabIndex={ariaHidden ? -1 : 0}
        className="block w-full text-left"
        aria-label={`Play ${item.title} tutorial video`}
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

          <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-background/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-primary backdrop-blur-md">
            {item.step}
          </span>

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                "bg-primary/90 text-primary-foreground",
                "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)]",
                "transition-transform duration-300 group-hover:scale-110",
              )}
            >
              <Play size={22} className="ml-0.5 fill-current" />
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
