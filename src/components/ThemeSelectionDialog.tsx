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
          {/* Light Mode Card */}
          <button
            onClick={() => handleSelect("light")}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
              "hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.05)] active:scale-95",
              "border-border"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Sun className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">Light Mode</span>
            {/* Light UI Preview */}
            <div className="w-full rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gray-200" />
                <div className="h-2 w-12 rounded bg-gray-800" />
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-2 space-y-1.5">
                <div className="h-1.5 w-full rounded bg-gray-300" />
                <div className="h-1.5 w-3/4 rounded bg-gray-200" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-4 flex-1 rounded bg-[hsl(45,93%,47%)]" />
                <div className="h-4 flex-1 rounded border border-gray-200 bg-white" />
              </div>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            onClick={() => handleSelect("dark")}
            className={cn(
              "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
              "hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.05)] active:scale-95",
              "border-primary"
            )}
          >
            <span className="absolute -top-2.5 right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Recommended
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-blue-300">
              <Moon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">Dark Mode</span>
            {/* Dark UI Preview */}
            <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-zinc-700" />
                <div className="h-2 w-12 rounded bg-zinc-200" />
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-800 p-2 space-y-1.5">
                <div className="h-1.5 w-full rounded bg-zinc-500" />
                <div className="h-1.5 w-3/4 rounded bg-zinc-600" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-4 flex-1 rounded bg-[hsl(45,93%,47%)]" />
                <div className="h-4 flex-1 rounded border border-zinc-700 bg-zinc-800" />
              </div>
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
