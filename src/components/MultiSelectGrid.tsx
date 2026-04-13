import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronUp, ChevronDown, Pause } from "lucide-react";

const SUTURE_SIZES = ["0", "2-0", "3-0", "4-0", "5-0", "6-0", "7-0", "8-0"];

interface MultiSelectOption {
  name: string;
  desc: string;
}

interface ItemData {
  name: string;
  qty: number;
  hold?: boolean;
  holdQty?: number;
  notes?: string;
  sizes?: string[];
}

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

const MultiSelectGrid = ({ options, value, onChange, addLabel = "Add Item", supportsHold = false, supportsSizes = false, hideInternalAdd = false, procedureSuggestions = [], specialtySuggestions = [], procedureName, specialtyName }: MultiSelectGridProps) => {
  const items = parseItems(value);
  const selectedNames = items.map((i) => i.name);
  const [showInput, setShowInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedNames = options.map((o) => o.name);
  const customItems = items.filter((i) => !predefinedNames.includes(i.name));

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

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
      const currentSizes = i.sizes || [];
      const has = currentSizes.includes(size);
      return { ...i, sizes: has ? currentSizes.filter((s) => s !== size) : [...currentSizes, size] };
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

  const renderSelectedItem = (item: ItemData, isCustom: boolean) => (
    <div
      key={item.name}
      className="rounded-xl border border-primary bg-primary/15 shadow-sm shadow-primary/10 p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => toggle(item.name)} className="mt-0.5">
          <Checkbox checked={true} className="pointer-events-none" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-primary truncate">{item.name}</span>
            {isCustom && (
              <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary shrink-0">Custom</Badge>
            )}
            {item.hold && (
              <Badge className="text-[8px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Pause size={8} className="mr-0.5" />Hold
              </Badge>
            )}
          </div>
          {isCustom && <span className="text-[10px] text-muted-foreground leading-tight">Custom item</span>}
        </div>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-3 pl-7">
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

      {/* Hold qty row */}
      {supportsHold && item.hold && (
        <div className="flex items-center gap-3 pl-7">
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

      {/* Size selection for sutures */}
      {supportsSizes && (
        <div className="pl-7 space-y-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sizes</span>
          <div className="flex flex-wrap gap-1.5">
            {SUTURE_SIZES.map((size) => {
              const isSelected = (item.sizes || []).includes(size);
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
        </div>
      )}

      <div className="pl-7">
        <textarea
          value={item.notes || ""}
          onChange={(e) => updateNotes(item.name, e.target.value)}
          placeholder="Add notes..."
          rows={1}
          className="w-full text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/50 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );

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

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      <div className="grid grid-cols-1 gap-3">
        {/* Selected items first */}
        {customItems.map((item) => renderSelectedItem(item, true))}
        {options
          .filter((opt) => items.some((i) => i.name === opt.name))
          .map((opt) => renderSelectedItem(items.find((i) => i.name === opt.name)!, false))}

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
