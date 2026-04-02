import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeSelectionDialogProps {
  open: boolean;
  onComplete: () => void;
}

const ThemeSelectionDialog = ({ open, onComplete }: ThemeSelectionDialogProps) => {
  const { setTheme } = useTheme();

  const handleSelect = (mode: "light" | "dark") => {
    setTheme(mode);
    localStorage.setItem("hasChosenTheme", "true");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Choose Your Display Mode</DialogTitle>
          <DialogDescription className="text-center">
            Select how you'd like the app to appear.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <button
            onClick={() => handleSelect("light")}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 transition-all",
              "hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] active:scale-95"
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
              <Sun className="h-8 w-8" />
            </div>
            <span className="font-medium text-foreground">Light Mode</span>
            <div className="h-12 w-full rounded-lg border border-border bg-card flex items-center gap-1.5 px-2">
              <div className="h-2 w-8 rounded bg-muted-foreground/30" />
              <div className="h-2 w-5 rounded bg-muted" />
            </div>
          </button>

          <button
            onClick={() => handleSelect("dark")}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 transition-all",
              "hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] active:scale-95"
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
              <Moon className="h-8 w-8" />
            </div>
            <span className="font-medium text-foreground">Dark Mode</span>
            <div className="h-12 w-full rounded-lg border border-border bg-card flex items-center gap-1.5 px-2">
              <div className="h-2 w-8 rounded bg-muted-foreground/30" />
              <div className="h-2 w-5 rounded bg-muted" />
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          You can change this anytime in Settings.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelectionDialog;
