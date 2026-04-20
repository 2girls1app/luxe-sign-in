import { useState, useEffect, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
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
  procedureSuggestions?: string[];
  specialtySuggestions?: string[];
  procedureName?: string;
  specialtyName?: string;
}

const parseGloveValue = (val: string): { doctor: string; first_assist: string } => {
  try {
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { doctor: parsed.doctor || "", first_assist: parsed.first_assist || "" };
    }
  } catch { /* fallback for legacy single-string values */ }
  // Legacy: treat plain string as doctor glove size
  return { doctor: val || "", first_assist: "" };
};

const parsePositionValue = (val: string): { position: string; notes: string } => {
  try {
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "position" in parsed) {
      return { position: parsed.position || "", notes: parsed.notes || "" };
    }
  } catch { /* legacy: plain-string position name */ }
  return { position: val || "", notes: "" };
};

const PreferenceDetailDrawer = ({
  open, onOpenChange, category, currentValue, onSave, saving,
  procedureSuggestions = [], specialtySuggestions = [], procedureName, specialtyName,
}: PreferenceDetailDrawerProps) => {
  const [value, setValue] = useState(currentValue);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const [doctorGlove, setDoctorGlove] = useState("");
  const [firstAssistGlove, setFirstAssistGlove] = useState("");
  const [positionName, setPositionName] = useState("");
  const [positionNotes, setPositionNotes] = useState("");

  useEffect(() => {
    setValue(currentValue);
    setShowAddInput(false);
    setCustomName("");
    if (category?.key === "gloves") {
      const parsed = parseGloveValue(currentValue);
      setDoctorGlove(parsed.doctor);
      setFirstAssistGlove(parsed.first_assist);
    }
    if (category?.key === "position") {
      const parsed = parsePositionValue(currentValue);
      setPositionName(parsed.position);
      setPositionNotes(parsed.notes);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentValue, open, category?.key]);

  useEffect(() => {
    if (showAddInput && addInputRef.current) addInputRef.current.focus();
  }, [showAddInput]);

  if (!category) return null;

  const Icon = category.icon;
  const multiSelectOptions = MULTI_SELECT_CATEGORIES[category.key];
  const isMultiSelect = !!multiSelectOptions;

  const addLabel =
    category.key === "suture" ? "Add Suture" :
    category.key === "supplies" ? "Add Supply" :
    category.key === "trays" ? "Add Tray" :
    category.key === "robotic_instruments" ? "Add Robotic Item" :
    category.key === "instruments" ? "Add Instrument" :
    category.key === "equipment" ? "Add Equipment" :
    category.key === "skinprep" ? "Add Skin Prep" :
    category.key === "medication" ? "Add Medication" :
    category.key === "gloves" ? "Add Gloves" :
    `Add ${category.label}`;

  const addCustomToValue = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(value || "[]");
      if (Array.isArray(parsed)) {
        if (parsed.some((i: any) => i.name === trimmed)) {
          setCustomName("");
          setShowAddInput(false);
          return;
        }
        const updated = [...parsed, { name: trimmed, qty: 1, hold: false, holdQty: 1 }];
        setValue(JSON.stringify(updated));
      }
    } catch {
      const updated = [{ name: trimmed, qty: 1, hold: false, holdQty: 1 }];
      setValue(JSON.stringify(updated));
    }
    setCustomName("");
    setShowAddInput(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addCustomToValue(); }
    else if (e.key === "Escape") { setShowAddInput(false); setCustomName(""); }
  };

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
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2.5">Doctor Gloves</p>
                <div className="grid grid-cols-3 gap-3">
                  {GLOVE_SIZES.map((size) => (
                    <button
                      key={`doc-${size}`}
                      type="button"
                      onClick={() => setDoctorGlove(size)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium cursor-pointer transition-all ${
                        doctorGlove === size
                          ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2.5">First Assist Gloves</p>
                <div className="grid grid-cols-3 gap-3">
                  {GLOVE_SIZES.map((size) => (
                    <button
                      key={`fa-${size}`}
                      type="button"
                      onClick={() => setFirstAssistGlove(size)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium cursor-pointer transition-all ${
                        firstAssistGlove === size
                          ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : category.key === "position" ? (
            <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto space-y-4">
              <RadioGroup value={positionName} onValueChange={setPositionName} className="grid grid-cols-2 gap-3">
                {POSITIONS.map((pos) => (
                  <Label
                    key={pos.name}
                    htmlFor={`pos-${pos.name}`}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                      positionName === pos.name
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
                    <span className={`text-xs font-medium ${positionName === pos.name ? "text-primary" : "text-muted-foreground"}`}>
                      {pos.name}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Notes</p>
                <Textarea
                  value={positionNotes}
                  onChange={(e) => setPositionNotes(e.target.value)}
                  placeholder="Add positioning notes (e.g. arms tucked, padding, table tilt)..."
                  className="min-h-[90px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          ) : multiSelectOptions ? (
            <MultiSelectGrid
              options={multiSelectOptions}
              value={value}
              onChange={setValue}
              supportsHold={["suture", "supplies", "equipment", "instruments", "robotic_instruments"].includes(category.key)}
              supportsSizes={category.key === "suture"}
              addLabel={addLabel}
              hideInternalAdd={true}
              procedureSuggestions={procedureSuggestions}
              specialtySuggestions={specialtySuggestions}
              procedureName={procedureName}
              specialtyName={specialtyName}
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
          {isMultiSelect && (
            showAddInput ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-secondary p-3">
                <input
                  ref={addInputRef}
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  placeholder="Type custom item name..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button type="button" onClick={addCustomToValue} disabled={!customName.trim()} className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
                  <Plus size={14} />
                </button>
                <button type="button" onClick={() => { setShowAddInput(false); setCustomName(""); }} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddInput(true)}
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus size={16} className="mr-2" />
                {addLabel}
              </Button>
            )
          )}
          <Button
            onClick={() => {
              if (category.key === "gloves") {
                onSave(category.key, JSON.stringify({ doctor: doctorGlove, first_assist: firstAssistGlove }));
              } else if (category.key === "position") {
                onSave(category.key, JSON.stringify({ position: positionName, notes: positionNotes }));
              } else {
                onSave(category.key, value);
              }
            }}
            disabled={saving}
            className="w-full"
          >
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
