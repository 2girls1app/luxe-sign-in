import { useEffect, useRef, useState, useCallback } from "react";
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

const SCROLL_SPEED = 0.4; // px per frame ~ premium slow
const RESUME_DELAY = 1500;

interface TutorialCarouselProps {
  items?: TutorialItem[];
  onSelect?: (item: TutorialItem) => void;
}

export function TutorialCarousel({ items = DEFAULT_ITEMS, onSelect }: TutorialCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Triple the items for seamless infinite loop
  const loopedItems = [...items, ...items, ...items];

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Auto-scroll RAF loop
  useEffect(() => {
    if (reducedMotion) return;
    const el = scrollerRef.current;
    if (!el) return;

    const tick = () => {
      if (!isPausedRef.current && !isDraggingRef.current) {
        el.scrollLeft += SCROLL_SPEED;
        // Loop when we've scrolled past one full set
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2) {
          el.scrollLeft -= oneSetWidth;
        }
      }
      // Track active index for dots
      const cardWidth = el.scrollWidth / loopedItems.length;
      const idx = Math.round(el.scrollLeft / cardWidth) % items.length;
      setActiveIndex(idx);

      rafRef.current = requestAnimationFrame(tick);
    };

    // Start in the middle set so we can loop both directions
    const oneSetWidth = el.scrollWidth / 3;
    el.scrollLeft = oneSetWidth;

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, items.length, loopedItems.length]);

  const pauseAutoScroll = useCallback(() => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_DELAY);
  }, []);

  // Pointer drag for desktop / swipe for mobile
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    pauseAutoScroll();
    dragStartRef.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartRef.current.x;
    el.scrollLeft = dragStartRef.current.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = scrollerRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    scheduleResume();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / loopedItems.length;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      pauseAutoScroll();
      el.scrollBy({ left: cardWidth, behavior: "smooth" });
      scheduleResume();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      pauseAutoScroll();
      el.scrollBy({ left: -cardWidth, behavior: "smooth" });
      scheduleResume();
    }
  };

  const goToDot = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    pauseAutoScroll();
    const cardWidth = el.scrollWidth / loopedItems.length;
    const oneSetWidth = el.scrollWidth / 3;
    el.scrollTo({ left: oneSetWidth + cardWidth * idx, behavior: "smooth" });
    scheduleResume();
  };

  return (
    <section
      aria-label="Tutorial videos"
      className="w-full"
      onMouseEnter={pauseAutoScroll}
      onMouseLeave={() => {
        if (!isDraggingRef.current) isPausedRef.current = false;
      }}
    >
      <div className="relative">
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />

        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            "flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth",
            "scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
            "cursor-grab active:cursor-grabbing select-none",
            "py-3 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl",
          )}
        >
          {loopedItems.map((item, i) => (
            <article
              key={`${item.id}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${item.step}: ${item.title}`}
              className={cn(
                "group relative shrink-0 overflow-hidden rounded-2xl",
                "w-[78%] sm:w-[55%] md:w-[40%] lg:w-[32%]",
                "border border-border/60 bg-card",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1 hover:border-primary/60",
                "hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.4)]",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="block w-full text-left"
                aria-label={`Play ${item.title} tutorial video`}
              >
                {/* Thumbnail */}
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

                  {/* Step badge */}
                  <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-background/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-primary backdrop-blur-md">
                    {item.step}
                  </span>

                  {/* Play button */}
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

                {/* Body */}
                <div className="space-y-1.5 p-4">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="pt-2 text-[10px] font-medium tracking-wider text-primary/80">
                    {item.meta}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Tutorial steps">
        {items.map((item, idx) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeIndex === idx}
            aria-label={`Go to ${item.step}`}
            onClick={() => goToDot(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </section>
  );
}

export default TutorialCarousel;
