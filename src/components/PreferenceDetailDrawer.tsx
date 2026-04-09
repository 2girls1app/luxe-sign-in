import { useState, useEffect, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import MultiSelectGrid from "@/components/MultiSelectGrid";
import { MULTI_SELECT_CATEGORIES } from "@/data/preferenceOptions";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

import supineImg from "@/assets/positions/supine.png";
import proneImg from "@/assets/positions/prone.png";
import lateralImg from "@/assets/positions/lateral.png";
import lithotomyImg from "@/assets/positions/lithotomy.png";
import trendelenburgImg from "@/assets/positions/trendelenburg.png";
import reverseTrendelenburgImg from "@/assets/positions/reverse-trendelenburg.png";
import sittingImg from "@/assets/positions/sitting.png";
import jackknifeImg from "@/assets/positions/jackknife.png";

const GLOVE_SIZES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];
const POSITIONS: { name: string; img: string }[] = [
  { name: "Supine", img: supineImg },
  { name: "Prone", img: proneImg },
  { name: "Lateral", img: lateralImg },
  { name: "Lithotomy", img: lithotomyImg },
  { name: "Trendelenburg", img: trendelenburgImg },
  { name: "Reverse Trendelenburg", img: reverseTrendelenburgImg },
  { name: "Sitting", img: sittingImg },
  { name: "Jackknife", img: jackknifeImg },
];

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(currentValue);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentValue, open]);

  if (!category) return null;

  const Icon = category.icon;
  const multiSelectOptions = MULTI_SELECT_CATEGORIES[category.key];

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
          {category.key === "gloves" ? (
            <RadioGroup value={value} onValueChange={setValue} className="grid grid-cols-3 gap-3">
              {GLOVE_SIZES.map((size) => (
                <Label
                  key={size}
                  htmlFor={`glove-${size}`}
                  className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium cursor-pointer transition-all ${
                    value === size
                      ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <RadioGroupItem value={size} id={`glove-${size}`} className="sr-only" />
                  {size}
                </Label>
              ))}
            </RadioGroup>
          ) : category.key === "position" ? (
            <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto">
              <RadioGroup value={value} onValueChange={setValue} className="grid grid-cols-2 gap-3">
                {POSITIONS.map((pos) => (
                  <Label
                    key={pos.name}
                    htmlFor={`pos-${pos.name}`}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                      value === pos.name
                        ? "border-primary bg-primary/15 shadow-sm shadow-primary/10"
                        : "border-border bg-secondary hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value={pos.name} id={`pos-${pos.name}`} className="sr-only" />
                    <img
                      src={pos.img}
                      alt={pos.name}
                      loading="lazy"
                      width={100}
                      height={100}
                      className="w-20 h-20 object-contain"
                    />
                    <span className={`text-xs font-medium ${value === pos.name ? "text-primary" : "text-muted-foreground"}`}>
                      {pos.name}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ) : multiSelectOptions ? (
            <MultiSelectGrid
              options={multiSelectOptions}
              value={value}
              onChange={setValue}
              supportsHold={["suture", "supplies", "equipment", "instruments", "robotic_instruments"].includes(category.key)}
              addLabel={
                category.key === "suture" ? "Add Suture" :
                category.key === "supplies" ? "Add Supply" :
                category.key === "trays" ? "Add Tray" :
                category.key === "robotic_instruments" ? "Add Robotic Item" :
                category.key === "instruments" ? "Add Instrument" :
                category.key === "equipment" ? "Add Equipment" :
                category.key === "skinprep" ? "Add Skin Prep" :
                `Add ${category.label}`
              }
            />
          ) : (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter your ${category.label.toLowerCase()} preference...`}
              className="min-h-[100px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          )}
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
