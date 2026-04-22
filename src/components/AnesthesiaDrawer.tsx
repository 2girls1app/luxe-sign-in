import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Stethoscope, Check } from "lucide-react";
import SelectedItemCard, { SelectedCountHeader } from "@/components/SelectedItemCard";

const ANESTHESIA_MEDS = [
  "Propofol", "Midazolam", "Fentanyl", "Rocuronium", "Succinylcholine",
  "Ketamine", "Lidocaine", "Dexmedetomidine", "Ondansetron", "Sevoflurane",
  "Desflurane", "Isoflurane", "Etomidate", "Remifentanil", "Sufentanil",
  "Cisatracurium", "Vecuronium", "Neostigmine", "Sugammadex", "Glycopyrrolate",
  "Ephedrine", "Phenylephrine", "Atropine", "Nitrous Oxide",
];

const ANTIBIOTICS = [
  "Ancef (Cefazolin)", "Vancomycin", "Clindamycin", "Gentamicin",
  "Zosyn (Piperacillin/Tazobactam)", "Rocephin (Ceftriaxone)",
  "Flagyl (Metronidazole)", "Levaquin (Levofloxacin)", "Unasyn (Ampicillin/Sulbactam)",
];

const TUBE_OPTIONS = ["ETT", "LMA", "Nasal Airway", "Oral Airway", "None"];

interface AnesthesiaData {
  meds: string[];
  antibiotics: string[];
  tube: string;
  paralyze: string;
  notes: string;
}

interface AnesthesiaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onSave: (category: string, value: string) => Promise<void>;
  saving: boolean;
}

const SelectableList = ({
  label,
  items,
  selected,
  onToggle,
  searchPlaceholder,
  customPlaceholder,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  searchPlaceholder: string;
  customPlaceholder: string;
}) => {
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [customItem, setCustomItem] = useState("");

  const filtered = items.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  const addCustom = () => {
    const trimmed = customItem.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onToggle(trimmed);
      setCustomItem("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {selected.length > 0 && (
        <div className="space-y-2">
          <SelectedCountHeader count={selected.length} icon={<Check size={12} />} />
          <div className="space-y-1.5">
            {selected.map(item => (
              <SelectedItemCard
                key={item}
                name={item}
                onRemove={() => onToggle(item)}
                removeLabel={`Remove ${item}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/70 italic px-1">
            Tap × to remove a {label.toLowerCase().replace(/s$/, "")}
          </p>
        </div>
      )}
      {!showList ? (
        <button onClick={() => setShowList(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
          <Plus size={14} />
          {selected.length > 0 ? `Select more` : `Select ${label.toLowerCase()}`}
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-2 bg-card">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {filtered.map(item => {
              const sel = selected.includes(item);
              return (
                <button key={item} onClick={() => onToggle(item)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-left transition-colors ${sel ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-foreground"}`}>
                  {sel && <Check size={12} />}
                  <span className="truncate">{item}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            <Input placeholder={customPlaceholder} value={customItem} onChange={e => setCustomItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} className="h-8 text-xs flex-1" />
            <Button size="sm" variant="outline" onClick={addCustom} className="h-8 text-xs px-2"><Plus size={12} /></Button>
          </div>
          <button onClick={() => { setShowList(false); setSearch(""); }} className="text-[10px] text-muted-foreground hover:text-foreground self-end">Collapse</button>
        </div>
      )}
    </div>
  );
};

const AnesthesiaDrawer = ({ open, onOpenChange, currentValue, onSave, saving }: AnesthesiaDrawerProps) => {
  const [data, setData] = useState<AnesthesiaData>({ meds: [], antibiotics: [], tube: "", paralyze: "", notes: "" });

  useEffect(() => {
    if (open) {
      try {
        const parsed = JSON.parse(currentValue);
        setData({
          meds: parsed.meds || [],
          antibiotics: parsed.antibiotics || [],
          tube: parsed.tube || "",
          paralyze: parsed.paralyze || "",
          notes: parsed.notes || "",
        });
      } catch {
        setData({ meds: [], antibiotics: [], tube: "", paralyze: "", notes: "" });
      }
    }
  }, [open, currentValue]);

  const toggleMed = (med: string) => {
    setData(prev => ({ ...prev, meds: prev.meds.includes(med) ? prev.meds.filter(m => m !== med) : [...prev.meds, med] }));
  };

  const toggleAntibiotic = (ab: string) => {
    setData(prev => ({ ...prev, antibiotics: prev.antibiotics.includes(ab) ? prev.antibiotics.filter(a => a !== ab) : [...prev.antibiotics, ab] }));
  };

  const handleSave = () => {
    const hasData = data.meds.length > 0 || data.antibiotics.length > 0 || data.tube || data.paralyze || data.notes.trim();
    onSave("anesthesia", hasData ? JSON.stringify(data) : "");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Stethoscope size={18} className="text-primary" />
            Anesthesia
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-4 max-h-[70vh]">
          <div className="flex flex-col gap-5">
            <SelectableList label="Anesthesia Meds" items={ANESTHESIA_MEDS} selected={data.meds} onToggle={toggleMed} searchPlaceholder="Search medications..." customPlaceholder="Add custom med..." />

            {/* Antibiotics */}
            <SelectableList label="Antibiotics" items={ANTIBIOTICS} selected={data.antibiotics} onToggle={toggleAntibiotic} searchPlaceholder="Search antibiotics..." customPlaceholder="Add custom antibiotic..." />

            {/* Tube */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Tube</Label>
              <div className="flex flex-wrap gap-1.5">
                {TUBE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setData(prev => ({ ...prev, tube: prev.tube === opt ? "" : opt }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${data.tube === opt ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-card border-border text-foreground hover:border-primary/40"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Paralyze */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Paralyze</Label>
              <div className="flex gap-2">
                {["Yes", "No"].map(opt => (
                  <button key={opt} onClick={() => setData(prev => ({ ...prev, paralyze: prev.paralyze === opt ? "" : opt }))}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-all ${data.paralyze === opt ? (opt === "Yes" ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-muted text-foreground border-muted-foreground/30") : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Anesthesia Notes</Label>
              <textarea value={data.notes} onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional anesthesia notes..." rows={3}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        </ScrollArea>

        <div className="px-4 pb-4 pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Anesthesia"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AnesthesiaDrawer;
