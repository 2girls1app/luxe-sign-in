import { useState, useRef, useEffect } from "react";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const DEMO_VIDEO_URL =
  "https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/app-assets/demo-video.mp4";
const STORAGE_KEY = "hide_demo_popup";

export const DemoVideoPopup = () => {
  const [open, setOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dontShow, setDontShow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "true") {
      setOpen(true);
    }
  }, []);

  const handleClose = (value: boolean) => {
    if (!value && dontShow) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setOpen(value);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-primary/20 bg-card [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-gold">Welcome to 1st Assist</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              See how to add doctors, procedures, preference cards, and use AI import
            </p>
          </div>
          <button
            onClick={() => handleClose(false)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={DEMO_VIDEO_URL}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            className="w-full aspect-video object-contain"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                dontShow ? "bg-gold border-gold" : "border-muted-foreground"
              }`}
              onClick={() => setDontShow(!dontShow)}
            >
              {dontShow && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="hsl(0,0%,8%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs text-muted-foreground" onClick={() => setDontShow(!dontShow)}>
              Don't show this again
            </span>
          </label>
          <button
            onClick={() => handleClose(false)}
            className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
          >
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
