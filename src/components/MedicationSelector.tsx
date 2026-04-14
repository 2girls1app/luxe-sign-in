import { useState, useEffect, useMemo, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, Plus, X, ChevronDown, ChevronUp, Pencil, Check, Minus, Pause } from "lucide-react";
import { MEDICATIONS_DATABASE, MEDICATION_CATEGORIES, type MedicationEntry } from "@/data/medications";

export interface SelectedMedication {
  name: string;
  category: string;
  dosage?: string;
  route?: string;
  notes?: string;
  isCustom?: boolean;
  hold?: boolean;
  holdQty?: number;
}

interface MedicationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onSave: (category: string, value: string) => void;
  saving: boolean;
}

const ROUTES = ["IV", "IM", "PO", "SQ", "Local", "Topical", "Intranasal", "Rectal", "Nebulized"];

const parseMedications = (value: string): SelectedMedication[] => {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    if (value.trim()) {
      return [{ name: value.trim(), category: "Other", isCustom: true }];
    }
  }
  return [];
};

const MedicationSelector = ({
  open, onOpenChange, currentValue, onSave, saving,
}: MedicationSelectorProps) => {
  const [medications, setMedications] = useState<SelectedMedication[]>([]);
  const [search, setSearch] = useState("");
  const [showBrowser, setShowBrowser] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDosage, setEditDosage] = useState("");
  const [editRoute, setEditRoute] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMedications(parseMedications(currentValue));
      setSearch("");
      setShowBrowser(false);
      setShowCustom(false);
      setEditingIndex(null);
    }
  }, [currentValue, open]);

  const filteredMeds = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return MEDICATIONS_DATABASE.filter(
      (m) =>
        m.name.toLowerCase().includes(q) &&
        !medications.some((sel) => sel.name.toLowerCase() === m.name.toLowerCase())
    ).slice(0, 20);
  }, [search, medications]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, MedicationEntry[]> = {};
    filteredMeds.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [filteredMeds]);

  const browsableGroups = useMemo(() => {
    const groups: Record<string, MedicationEntry[]> = {};
    MEDICATIONS_DATABASE.forEach((m) => {
      if (!medications.some((sel) => sel.name.toLowerCase() === m.name.toLowerCase())) {
        if (!groups[m.category]) groups[m.category] = [];
        groups[m.category].push(m);
      }
    });
    return groups;
  }, [medications]);

  const addMedication = (med: MedicationEntry | { name: string; category: string; isCustom?: boolean }) => {
    const newMed: SelectedMedication = {
      name: med.name,
      category: med.category,
      isCustom: "isCustom" in med ? med.isCustom : false,
      hold: false,
      holdQty: 1,
    };
    setMedications((prev) => [newMed, ...prev]);
    setSearch("");
    setCustomName("");
    setShowCustom(false);
    setEditingIndex(0);
    setEditDosage("");
    setEditRoute("");
    setEditNotes("");
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const openEditor = (index: number) => {
    const med = medications[index];
    setEditingIndex(index);
    setEditDosage(med.dosage || "");
    setEditRoute(med.route || "");
    setEditNotes(med.notes || "");
  };

  const saveDetails = () => {
    if (editingIndex === null) return;
    setMedications((prev) =>
      prev.map((m, i) =>
        i === editingIndex
          ? { ...m, dosage: editDosage.trim() || undefined, route: editRoute || undefined, notes: editNotes.trim() || undefined }
          : m
      )
    );
    setEditingIndex(null);
  };

  const handleSave = () => {
    const value = medications.length > 0 ? JSON.stringify(medications) : "";
    onSave("medication", value);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    if (medications.some((m) => m.name.toLowerCase() === customName.trim().toLowerCase())) return;
    addMedication({ name: customName.trim(), category: "Other", isCustom: true });
  };

  const hasAvailableMeds = Object.values(browsableGroups).some((g) => g.length > 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Pill size={28} className="text-primary" />
          </div>
          <DrawerTitle className="text-foreground">Medications</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Search and select medications for this procedure
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 max-h-[60vh]">
          {/* ── Selected Medications (top preview section) ── */}
          {medications.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Check size={12} />
                Selected Medications ({medications.length})
              </p>
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div
                    key={`${med.name}-${index}`}
                    className="rounded-xl border-2 border-primary/30 bg-primary/5 overflow-hidden"
                  >
                    <div className="flex items-start gap-2 px-3 py-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Pill size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{med.name}</span>
                          {med.isCustom && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                              Custom
                            </Badge>
                          )}
                          {med.hold && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <Pause size={8} className="mr-0.5" />Hold
                            </Badge>
                          )}
                        </div>
                        {/* Detail pills */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {med.dosage && (
                            <span className="text-[10px] font-medium text-foreground bg-secondary rounded-md px-2 py-0.5 border border-border">
                              💊 {med.dosage}
                            </span>
                          )}
                          {med.route && (
                            <span className="text-[10px] font-medium text-foreground bg-secondary rounded-md px-2 py-0.5 border border-border">
                              🔄 {med.route}
                            </span>
                          )}
                          {med.notes && (
                            <span className="text-[10px] text-muted-foreground bg-secondary rounded-md px-2 py-0.5 border border-border">
                              📝 {med.notes}
                            </span>
                          )}
                          {!med.dosage && !med.route && !med.notes && (
                            <span className="text-[10px] text-muted-foreground/50 italic">Tap edit to add details</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditor(index)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit details"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => removeMedication(index)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Inline detail editor */}
                    {editingIndex === index && (
                      <div className="border-t border-primary/20 bg-secondary/30 px-3 py-3 space-y-2.5">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dosage</label>
                          <Input
                            value={editDosage}
                            onChange={(e) => setEditDosage(e.target.value)}
                            placeholder="e.g., 10 mL, 0.5%, 1g"
                            className="mt-1 h-8 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Route</label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {ROUTES.map((r) => (
                              <button
                                key={r}
                                onClick={() => setEditRoute(editRoute === r ? "" : r)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                  editRoute === r
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Additional notes..."
                            className="mt-1 h-8 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <Button size="sm" onClick={saveDetails} className="w-full text-xs">
                          Done
                        </Button>
                      </div>
                    )}

                    {/* Hold controls */}
                    <div className="border-t border-primary/10 px-3 py-2 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setMedications((prev) =>
                            prev.map((m, i) => i === index ? { ...m, hold: !m.hold, holdQty: m.holdQty ?? 1 } : m)
                          );
                        }}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-md border transition-colors ${
                          med.hold
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                        }`}
                      >
                        {med.hold ? "On Hold" : "Mark Hold"}
                      </button>
                      {med.hold && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] text-amber-400/80 uppercase tracking-wider">Hold Qty</span>
                          <button
                            onClick={() =>
                              setMedications((prev) =>
                                prev.map((m, i) => i === index ? { ...m, holdQty: Math.max(1, (m.holdQty ?? 1) - 1) } : m)
                              )
                            }
                            className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                          >
                            <ChevronDown size={12} className="text-amber-400" />
                          </button>
                          <span className="text-sm font-semibold text-amber-400 w-5 text-center">{med.holdQty ?? 1}</span>
                          <button
                            onClick={() =>
                              setMedications((prev) =>
                                prev.map((m, i) => i === index ? { ...m, holdQty: (m.holdQty ?? 1) + 1 } : m)
                              )
                            }
                            className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                          >
                            <ChevronUp size={12} className="text-amber-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Divider ── */}
          {medications.length > 0 && (showBrowser || search.trim()) && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Available</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* ── Search & Browse Section ── */}
          {(showBrowser || medications.length === 0) && (
            <>
              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setExpandedCategory(null);
                  }}
                  placeholder="Search medications..."
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Search Results */}
              {search.trim() && (
                <div className="rounded-xl border border-border bg-secondary/50 max-h-[200px] overflow-y-auto">
                  {filteredMeds.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No medications found.{" "}
                      <button
                        onClick={() => {
                          setCustomName(search);
                          setShowCustom(true);
                        }}
                        className="text-primary hover:underline"
                      >
                        Add custom
                      </button>
                    </div>
                  ) : (
                    Object.entries(groupedResults).map(([cat, meds]) => (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/80 sticky top-0">
                          {cat}
                        </div>
                        {meds.map((med) => (
                          <button
                            key={med.name}
                            onClick={() => addMedication(med)}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                          >
                            <Plus size={12} className="text-primary shrink-0" />
                            {med.name}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Browse by category (when not searching) */}
              {!search.trim() && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">Browse by Category</p>
                  <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                    {MEDICATION_CATEGORIES.map((cat) => {
                      const meds = browsableGroups[cat];
                      if (!meds || meds.length === 0) return null;
                      const isExpanded = expandedCategory === cat;
                      return (
                        <div key={cat} className="border-b border-border last:border-b-0">
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-primary/5 transition-colors"
                          >
                            <span>{cat} <span className="text-muted-foreground text-xs">({meds.length})</span></span>
                            {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                          </button>
                          {isExpanded && (
                            <div className="bg-secondary/50">
                              {meds.map((med) => (
                                <button
                                  key={med.name}
                                  onClick={() => addMedication(med)}
                                  className="w-full text-left px-6 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                                >
                                  <Plus size={12} className="text-primary" />
                                  {med.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add custom medication */}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="flex items-center gap-2 text-sm text-primary hover:underline px-1"
              >
                <Plus size={14} />
                Add custom medication
              </button>

              {showCustom && (
                <div className="flex gap-2">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter medication name..."
                    className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  />
                  <Button size="sm" onClick={addCustom} disabled={!customName.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── "+ Select more medications" button ── */}
          {medications.length > 0 && !showBrowser && (
            <button
              onClick={() => {
                setShowBrowser(true);
                setTimeout(() => searchRef.current?.focus(), 100);
              }}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/60 transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              Select more medications
            </button>
          )}
        </div>

        <DrawerFooter className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : `Save Medications${medications.length > 0 ? ` (${medications.length})` : ""}`}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MedicationSelector;
