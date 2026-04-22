import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ChevronUp, ChevronDown, Pause, Check } from "lucide-react";
import SelectedItemCard, { SelectedCountHeader } from "@/components/SelectedItemCard";

const SUTURE_SIZES = ["0", "2-0", "3-0", "4-0", "5-0", "6-0", "7-0", "8-0"];

interface MultiSelectOption {
  name: string;
  desc: string;
}

interface SizeEntry {
  size: string;
  qty: number;
}

interface ItemData {
  name: string;
  qty: number;
  hold?: boolean;
  holdQty?: number;
  notes?: string;
  sizes?: (string | SizeEntry)[];
}

const normalizeSizes = (sizes?: (string | SizeEntry)[]): SizeEntry[] => {
  if (!sizes) return [];
  return sizes.map((s) => typeof s === "string" ? { size: s, qty: 1 } : s);
};

const getSizeNames = (sizes?: (string | SizeEntry)[]): string[] =>
  normalizeSizes(sizes).map((s) => s.size);

interface MultiSelectGridProps {
  options: MultiSelectOption[];
  value: string;
  onChange: (value: string) => void;
  addLabel?: string;
  supportsHold?: boolean;
  supportsSizes?: boolean;
  hideInternalAdd?: boolean;
  procedureSuggestions?: string[];
  specialtySuggestions?: string[];
  procedureName?: string;
  specialtyName?: string;
  /** Singular noun for the section, used in the helper hint (e.g. "item", "supply", "instrument"). */
  itemNoun?: string;
}

const parseItems = (value: string): ItemData[] => {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item: any) => ({
      name: typeof item === "string" ? item : item.name,
      qty: item.qty ?? 1,
      hold: item.hold ?? false,
      holdQty: item.holdQty ?? 1,
      notes: item.notes ?? "",
      sizes: item.sizes ?? [],
    }));
  } catch {}
  return value.split(", ").filter(Boolean).map((name) => ({ name, qty: 1, hold: false, holdQty: 1, notes: "", sizes: [] }));
};

const serializeItems = (items: ItemData[]): string => {
  if (items.length === 0) return "";
  return JSON.stringify(items);
};

const MultiSelectGrid = ({ options, value, onChange, addLabel = "Add Item", supportsHold = false, supportsSizes = false, hideInternalAdd = false, procedureSuggestions = [], specialtySuggestions = [], procedureName, specialtyName, itemNoun = "item" }: MultiSelectGridProps) => {
  const items = parseItems(value);
  const selectedNames = items.map((i) => i.name);
  const [showInput, setShowInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showBrowser, setShowBrowser] = useState(items.length === 0);
  const [editingName, setEditingName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedNames = options.map((o) => o.name);
  const customItems = items.filter((i) => !predefinedNames.includes(i.name));

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  // Auto-expand browser when there are no selections
  useEffect(() => {
    if (items.length === 0) setShowBrowser(true);
  }, [items.length]);

  const updateItems = (newItems: ItemData[]) => {
    onChange(serializeItems(newItems));
  };

  const toggle = (name: string) => {
    const existing = items.find((i) => i.name === name);
    if (existing) {
      updateItems(items.filter((i) => i.name !== name));
    } else {
      updateItems([...items, { name, qty: 1, hold: false, holdQty: 1, notes: "", sizes: [] }]);
    }
  };

  const toggleSize = (name: string, size: string) => {
    updateItems(items.map((i) => {
      if (i.name !== name) return i;
      const current = normalizeSizes(i.sizes);
      const has = current.some((s) => s.size === size);
      const newSizes = has ? current.filter((s) => s.size !== size) : [...current, { size, qty: 1 }];
      return { ...i, sizes: newSizes };
    }));
  };

  const updateSizeQty = (name: string, size: string, delta: number) => {
    updateItems(items.map((i) => {
      if (i.name !== name) return i;
      const current = normalizeSizes(i.sizes);
      return { ...i, sizes: current.map((s) => s.size === size ? { ...s, qty: Math.max(1, s.qty + delta) } : s) };
    }));
  };

  const updateQty = (name: string, delta: number) => {
    updateItems(items.map((i) => i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const toggleHold = (name: string) => {
    updateItems(items.map((i) => i.name === name ? { ...i, hold: !i.hold } : i));
  };

  const updateHoldQty = (name: string, delta: number) => {
    updateItems(items.map((i) => i.name === name ? { ...i, holdQty: Math.max(1, (i.holdQty ?? 1) + delta) } : i));
  };

  const updateNotes = (name: string, notes: string) => {
    updateItems(items.map((i) => i.name === name ? { ...i, notes } : i));
  };

  const addCustomItem = () => {
    const trimmed = customName.trim();
    if (!trimmed || selectedNames.includes(trimmed)) {
      setCustomName("");
      setShowInput(false);
      return;
    }
    updateItems([...items, { name: trimmed, qty: 1, hold: false, holdQty: 1, notes: "" }]);
    setCustomName("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addCustomItem(); }
    else if (e.key === "Escape") { setShowInput(false); setCustomName(""); }
  };

  const renderSelectedItem = (item: ItemData, isCustom: boolean) => {
    const badges = (
      <>
        {isCustom && (
          <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary px-1.5 py-0.5 uppercase tracking-wider">
            Custom
          </span>
        )}
        {!supportsSizes && item.qty > 1 && (
          <span className="inline-flex items-center rounded-md bg-secondary border border-border/60 text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5">
            ×{item.qty}
          </span>
        )}
        {item.hold && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400 px-1.5 py-0.5 uppercase tracking-wider">
            <Pause size={9} />
            On hold{item.holdQty && item.holdQty > 1 ? ` ×${item.holdQty}` : ""}
          </span>
        )}
      </>
    );

    const isExpanded = editingName === item.name;

    return (
      <SelectedItemCard
        key={item.name}
        name={item.name}
        notes={item.notes}
        badges={badges}
        onRemove={() => toggle(item.name)}
        removeLabel={`Remove ${item.name}`}
        onClick={() => setEditingName(isExpanded ? null : item.name)}
        highlighted={isExpanded}
        compactNotes={!isExpanded}
      >
        {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-border/40 mt-1">
          {/* Qty controls — hide for sutures since qty is per-size */}
          {!supportsSizes && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-8">Qty</span>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => updateQty(item.name, -1)} className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors">
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold text-foreground w-6 text-center">{item.qty}</span>
                <button type="button" onClick={() => updateQty(item.name, 1)} className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors">
                  <ChevronUp size={12} className="text-muted-foreground" />
                </button>
              </div>

              {supportsHold && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => toggleHold(item.name)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-colors ${
                      item.hold
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {item.hold ? "On Hold" : "Hold"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!supportsSizes && supportsHold && item.hold && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-amber-400/80 uppercase tracking-wider w-8">Hold</span>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => updateHoldQty(item.name, -1)} className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                  <ChevronDown size={12} className="text-amber-400" />
                </button>
                <span className="text-sm font-semibold text-amber-400 w-6 text-center">{item.holdQty ?? 1}</span>
                <button type="button" onClick={() => updateHoldQty(item.name, 1)} className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                  <ChevronUp size={12} className="text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {supportsSizes && supportsHold && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hold</span>
              <button
                type="button"
                onClick={() => toggleHold(item.name)}
                className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-colors ${
                  item.hold
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {item.hold ? "On Hold" : "Hold"}
              </button>
              {item.hold && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button type="button" onClick={() => updateHoldQty(item.name, -1)} className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                    <ChevronDown size={12} className="text-amber-400" />
                  </button>
                  <span className="text-sm font-semibold text-amber-400 w-6 text-center">{item.holdQty ?? 1}</span>
                  <button type="button" onClick={() => updateHoldQty(item.name, 1)} className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                    <ChevronUp size={12} className="text-amber-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {supportsSizes && (
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sizes</span>
              <div className="flex flex-wrap gap-1.5">
                {SUTURE_SIZES.map((size) => {
                  const isSelected = getSizeNames(item.sizes).includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(item.name, size)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {normalizeSizes(item.sizes).length > 0 && (
                <div className="mt-2 rounded-lg bg-secondary/40 border border-border/60 p-2 space-y-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quantity per size</span>
                  {normalizeSizes(item.sizes).map((entry) => (
                    <div key={entry.size} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary w-12">{entry.size}</span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button type="button" onClick={() => updateSizeQty(item.name, entry.size, -1)} className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors">
                          <ChevronDown size={12} className="text-muted-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground w-7 text-center">{entry.qty}</span>
                        <button type="button" onClick={() => updateSizeQty(item.name, entry.size, 1)} className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-card transition-colors">
                          <ChevronUp size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              value={item.notes || ""}
              onChange={(e) => updateNotes(item.name, e.target.value)}
              placeholder="Add notes for this item..."
              rows={2}
              className="mt-1 w-full text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
        )}
      </SelectedItemCard>
    );
  };

  // Categorize unselected options into suggestion groups
  const unselectedOptions = options.filter((opt) => !items.some((i) => i.name === opt.name));
  const procSuggestedSet = new Set(procedureSuggestions);
  const specSuggestedSet = new Set(specialtySuggestions);

  const procSuggested = unselectedOptions.filter((opt) => procSuggestedSet.has(opt.name));
  const specSuggested = unselectedOptions.filter((opt) => specSuggestedSet.has(opt.name) && !procSuggestedSet.has(opt.name));
  const remaining = unselectedOptions.filter((opt) => !procSuggestedSet.has(opt.name) && !specSuggestedSet.has(opt.name));

  const hasSuggestions = procSuggested.length > 0 || specSuggested.length > 0;

  const renderUnselectedItem = (opt: MultiSelectOption) => (
    <button
      key={opt.name}
      type="button"
      onClick={() => toggle(opt.name)}
      className="flex items-start gap-2 rounded-xl border border-border bg-secondary hover:border-primary/40 p-3 cursor-pointer transition-all text-left"
    >
      <Checkbox checked={false} className="mt-0.5 pointer-events-none" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{opt.name}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
      </div>
    </button>
  );

  const totalSelected = items.length;

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      <div className="grid grid-cols-1 gap-3">
        {/* Selected items header */}
        {totalSelected > 0 && (
          <SelectedCountHeader count={totalSelected} icon={<Check size={12} />} />
        )}

        {/* Selected items first - 3-column grid */}
        {totalSelected > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {customItems.map((item) => renderSelectedItem(item, true))}
            {options
              .filter((opt) => items.some((i) => i.name === opt.name))
              .map((opt) => renderSelectedItem(items.find((i) => i.name === opt.name)!, false))}
          </div>
        )}

        {/* Helper hint — shown only when there are selections */}
        {totalSelected > 0 && (
          <p className="text-[10px] text-muted-foreground/70 italic px-1 -mt-1">
            Tap a {itemNoun} to edit {supportsSizes ? "sizes, quantity, or notes" : "quantity or notes"}
          </p>
        )}

        {/* Browser section — selectable items (suggestions + all). Hidden by default when items are selected. */}
        {showBrowser && (
          <>
            {/* Suggested for this Procedure */}
            {procSuggested.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Suggested for {procedureName || "this Procedure"}
                  </span>
                  <div className="flex-1 h-px bg-primary/20" />
                </div>
                {procSuggested.map(renderUnselectedItem)}
              </>
            )}

            {/* Common for this Specialty */}
            {specSuggested.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                    Common for {specialtyName || "this Specialty"}
                  </span>
                  <div className="flex-1 h-px bg-primary/10" />
                </div>
                {specSuggested.map(renderUnselectedItem)}
              </>
            )}

            {/* All Items */}
            {hasSuggestions && remaining.length > 0 && (
              <div className="flex items-center gap-2 mt-2 mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  All Items
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {remaining.map(renderUnselectedItem)}

            {/* Collapse the browser when there are selections */}
            {totalSelected > 0 && (
              <button
                type="button"
                onClick={() => setShowBrowser(false)}
                className="self-end text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1 mt-1"
              >
                Collapse <ChevronUp size={12} />
              </button>
            )}
          </>
        )}

        {/* "+ Select more" button — shown when browser is collapsed */}
        {!showBrowser && totalSelected > 0 && (
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/60 transition-all active:scale-[0.98] mt-1"
          >
            <Plus size={16} />
            Select more {itemNoun}s
          </button>
        )}
      </div>

      {/* Add custom item - only when not externally managed */}
      {!hideInternalAdd && (
        <div className="mt-3">
          {showInput ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-secondary p-3">
              <input
                ref={inputRef}
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type custom item name..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button type="button" onClick={addCustomItem} disabled={!customName.trim()} className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
                <Plus size={14} />
              </button>
              <button type="button" onClick={() => { setShowInput(false); setCustomName(""); }} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="flex items-center gap-2 w-full rounded-xl border border-dashed border-border hover:border-primary/50 p-3 text-sm text-muted-foreground hover:text-primary transition-all"
            >
              <Plus size={16} />
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectGrid;
