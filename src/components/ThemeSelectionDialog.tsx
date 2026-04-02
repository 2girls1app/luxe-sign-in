import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeSelectionDialogProps {
  open: boolean;
  onComplete: () => void;
}

const ThemeSelectionDialog = ({ open, onComplete }: ThemeSelectionDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState<"light" | "dark">(theme);

  const handleSave = () => {
    setTheme(selected);
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
            onClick={() => setSelected("light")}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
              selected === "light"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Sun className="h-8 w-8" />
            </div>
            <span className="font-medium text-foreground">Light Mode</span>
            <div className="h-12 w-full rounded-lg bg-white border border-gray-200 flex items-center gap-1.5 px-2">
              <div className="h-2 w-8 rounded bg-gray-300" />
              <div className="h-2 w-5 rounded bg-gray-200" />
            </div>
          </button>

          <button
            onClick={() => setSelected("dark")}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
              selected === "dark"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 text-indigo-300">
              <Moon className="h-8 w-8" />
            </div>
            <span className="font-medium text-foreground">Dark Mode</span>
            <div className="h-12 w-full rounded-lg bg-gray-900 border border-gray-700 flex items-center gap-1.5 px-2">
              <div className="h-2 w-8 rounded bg-gray-600" />
              <div className="h-2 w-5 rounded bg-gray-700" />
            </div>
          </button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Preference
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelectionDialog;
