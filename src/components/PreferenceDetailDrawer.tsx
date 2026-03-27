import { useState, useEffect } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

interface PreferenceDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PreferenceCategory | null;
  currentValue: string;
  onSave: (category: string, value: string) => void;
  saving: boolean;
}

const PreferenceDetailDrawer = ({
  open, onOpenChange, category, currentValue, onSave, saving,
}: PreferenceDetailDrawerProps) => {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, open]);

  if (!category) return null;

  const Icon = category.icon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Icon size={28} className="text-primary" />
          </div>
          <DrawerTitle className="text-foreground">{category.label}</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Set your preference for this category
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter your ${category.label.toLowerCase()} preference...`}
            className="min-h-[100px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
        <DrawerFooter>
          <Button
            onClick={() => onSave(category.key, value)}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Preference"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PreferenceDetailDrawer;
