import { useState, useEffect } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Pencil, Trash2, Check, X } from "lucide-react";

interface StepsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onSave: (category: string, value: string) => void;
  saving: boolean;
}

const StepsDrawer = ({ open, onOpenChange, currentValue, onSave, saving }: StepsDrawerProps) => {
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      try {
        const parsed = JSON.parse(currentValue);
        if (Array.isArray(parsed)) {
          setSteps(parsed);
        } else {
          setSteps(currentValue ? [currentValue] : []);
        }
      } catch {
        setSteps(currentValue ? [currentValue] : []);
      }
      setNewStep("");
      setEditingIndex(null);
    }
  }, [currentValue, open]);

  const addStep = () => {
    const trimmed = newStep.trim();
    if (!trimmed) return;
    setSteps((prev) => [...prev, trimmed]);
    setNewStep("");
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(steps[index]);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setSteps((prev) => prev.map((s, i) => (i === editingIndex ? trimmed : s)));
    setEditingIndex(null);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const updated = [...steps];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSteps(updated);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveStep(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleSave = () => {
    const value = steps.length > 0 ? JSON.stringify(steps) : "";
    onSave("steps", value);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[90vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-foreground">Procedure Steps</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Build a step-by-step list for this procedure
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 flex flex-col gap-3">
          {/* Add new step */}
          <div className="flex gap-2">
            <Input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              placeholder="Add a step..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStep();
                }
              }}
            />
            <Button size="icon" onClick={addStep} disabled={!newStep.trim()} className="shrink-0">
              <Plus size={18} />
            </Button>
          </div>

          {/* Steps list */}
          <div className="max-h-[45vh] overflow-y-auto space-y-2">
            {steps.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No steps added yet. Add your first step above.
              </p>
            )}
            {steps.map((step, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  dragIndex === index
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary"
                }`}
              >
                <GripVertical size={16} className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>

                {editingIndex === index ? (
                  <div className="flex-1 flex gap-1.5">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 bg-background border-border text-foreground text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") setEditingIndex(null);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary" onClick={confirmEdit}>
                      <Check size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => setEditingIndex(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground truncate">{step}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(index)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeStep(index)}>
                      <Trash2 size={13} />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Steps"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default StepsDrawer;
