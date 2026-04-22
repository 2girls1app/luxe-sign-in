import { useState, useEffect, useMemo, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, Plus, ChevronDown, ChevronUp, Check, Pause } from "lucide-react";
import { MEDICATIONS_DATABASE, MEDICATION_CATEGORIES, type MedicationEntry } from "@/data/medications";
import SelectedItemCard, { SelectedCountHeader } from "@/components/SelectedItemCard";

// Stable color palette mapped to medication categories
const CATEGORY_DOT_COLORS: Record<string, string> = {
  "Local Anesthetics": "bg-sky-400",
  "Analgesics": "bg-rose-400",
  "Antibiotics": "bg-emerald-400",
  "Anti-emetics": "bg-violet-400",
  "Steroids": "bg-amber-400",
  "Sedatives": "bg-indigo-400",
  "Paralytics": "bg-fuchsia-400",
  "Reversal Agents": "bg-teal-400",
  "Vasoactive": "bg-red-400",
  "Antiseptics": "bg-lime-400",
  "Hemostatics": "bg-orange-400",
  "Other": "bg-slate-400",
};
const getCategoryDot = (cat: string) => CATEGORY_DOT_COLORS[cat] || "bg-primary";

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
  procedureSuggestions?: string[];
  specialtySuggestions?: string[];
  procedureName?: string;
  specialtyName?: string;
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
  procedureSuggestions = [], specialtySuggestions = [], procedureName, specialtyName,
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

  // Suggested medications from history
  const suggestedProcMeds = useMemo(() => {
    const procSet = new Set(procedureSuggestions.map(s => s.toLowerCase()));
    return MEDICATIONS_DATABASE.filter(
      (m) => procSet.has(m.name.toLowerCase()) && !medications.some((sel) => sel.name.toLowerCase() === m.name.toLowerCase())
    );
  }, [procedureSuggestions, medications]);

  const suggestedSpecMeds = useMemo(() => {
    const specSet = new Set(specialtySuggestions.map(s => s.toLowerCase()));
    const procSet = new Set(procedureSuggestions.map(s => s.toLowerCase()));
    return MEDICATIONS_DATABASE.filter(
      (m) => specSet.has(m.name.toLowerCase()) && !procSet.has(m.name.toLowerCase()) && !medications.some((sel) => sel.name.toLowerCase() === m.name.toLowerCase())
    );
  }, [specialtySuggestions, procedureSuggestions, medications]);

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
          {/* ── Selected Medications (card rows) ── */}
          {medications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Check size={12} />
                  Selected Medications
                </p>
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
                  {medications.length} selected
                </Badge>
              </div>
              <div className="space-y-2">
                {medications.map((med, index) => {
                  const isExpanded = editingIndex === index;
                  const hasNotes = !!(med.notes && med.notes.trim());
                  return (
                    <div
                      key={`${med.name}-${index}`}
                      className={`rounded-xl border bg-[hsl(0_0%_14%)] transition-all ${
                        isExpanded
                          ? "border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                          : "border-border/60 hover:border-primary/40"
                      } ${med.hold ? "opacity-90" : ""}`}
                    >
                      {/* Row header (tap target) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            saveDetails();
                          } else {
                            openEditor(index);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {med.name}
                        </span>
                        {med.route && (
                          <span className="inline-flex items-center rounded-md bg-secondary border border-border/60 text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                            {med.route}
                          </span>
                        )}
                        {med.hold && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 border border-primary/40 text-[10px] font-semibold text-primary px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                            <Pause size={9} />On hold
                          </span>
                        )}
                        {hasNotes && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-primary shrink-0">
                            <Pencil size={11} />
                            See notes
                          </span>
                        )}
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedication(index);
                          }}
                          className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors shrink-0"
                          aria-label={`Remove ${med.name}`}
                        >
                          <X size={14} />
                        </span>
                      </button>

                      {/* Expanded section */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
                          {/* Notes display */}
                          <div className="rounded-lg bg-[hsl(0_0%_10%)] border-l-2 border-primary px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-1">
                              Notes
                            </p>
                            {hasNotes ? (
                              <p className="text-sm text-foreground whitespace-pre-wrap">{med.notes}</p>
                            ) : (
                              <p className="text-xs italic text-muted-foreground/70">No notes added</p>
                            )}
                          </div>

                          {/* Edit fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dosage</label>
                              <Input
                                value={editDosage}
                                onChange={(e) => setEditDosage(e.target.value)}
                                placeholder="e.g., 10 mL"
                                className="mt-1 h-8 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Route</label>
                              <select
                                value={editRoute}
                                onChange={(e) => setEditRoute(e.target.value)}
                                className="mt-1 h-8 w-full rounded-md bg-secondary border border-border text-foreground text-sm px-2"
                              >
                                <option value="">—</option>
                                {ROUTES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Edit notes</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes for this medication..."
                              rows={2}
                              className="mt-1 w-full rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>

                          {/* Action row */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMedications((prev) =>
                                  prev.map((m, i) => i === index ? { ...m, hold: !m.hold, holdQty: m.holdQty ?? 1 } : m)
                                );
                              }}
                              className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                            >
                              <Pause size={12} className="mr-1" />
                              {med.hold ? "Remove hold" : "Mark hold"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDetails();
                              }}
                              className="h-8 text-xs"
                            >
                              <Check size={12} className="mr-1" />
                              Save notes
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDetails();
                              }}
                              className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                            >
                              See less <ChevronUp size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/70 italic px-1">
                Tap a medication to view notes or mark as hold
              </p>
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

              {/* Suggested for this Procedure */}
              {!search.trim() && suggestedProcMeds.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Suggested for {procedureName || "this Procedure"}
                    </span>
                    <div className="flex-1 h-px bg-primary/20" />
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                    {suggestedProcMeds.map((med) => (
                      <button
                        key={med.name}
                        onClick={() => addMedication(med)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <Plus size={12} className="text-primary" />
                        {med.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Common for this Specialty */}
              {!search.trim() && suggestedSpecMeds.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
                      Common for {specialtyName || "this Specialty"}
                    </span>
                    <div className="flex-1 h-px bg-primary/10" />
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                    {suggestedSpecMeds.map((med) => (
                      <button
                        key={med.name}
                        onClick={() => addMedication(med)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <Plus size={12} className="text-primary" />
                        {med.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse by category (when not searching) */}
              {!search.trim() && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    {(suggestedProcMeds.length > 0 || suggestedSpecMeds.length > 0) ? "All Medications" : "Browse by Category"}
                  </p>
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
