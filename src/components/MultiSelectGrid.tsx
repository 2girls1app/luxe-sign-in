import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface MultiSelectOption {
  name: string;
  desc: string;
}

interface MultiSelectGridProps {
  options: MultiSelectOption[];
  value: string;
  onChange: (value: string) => void;
  addLabel?: string;
}

const MultiSelectGrid = ({ options, value, onChange, addLabel = "Add Item" }: MultiSelectGridProps) => {
  const selected = value.split(", ").filter(Boolean);
  const [showInput, setShowInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom items = selected items not in the predefined options
  const predefinedNames = options.map((o) => o.name);
  const customItems = selected.filter((s) => !predefinedNames.includes(s));

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const toggle = (name: string) => {
    const isChecked = selected.includes(name);
    const next = isChecked
      ? selected.filter((s) => s !== name)
      : [...selected, name];
    onChange(next.join(", "));
  };

  const addCustomItem = () => {
    const trimmed = customName.trim();
    if (!trimmed || selected.includes(trimmed)) {
      setCustomName("");
      setShowInput(false);
      return;
    }
    const next = [...selected, trimmed];
    onChange(next.join(", "));
    setCustomName("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomItem();
    } else if (e.key === "Escape") {
      setShowInput(false);
      setCustomName("");
    }
  };

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        {/* Custom items first */}
        {customItems.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className="flex items-start gap-2 rounded-xl border border-primary bg-primary/15 shadow-sm shadow-primary/10 p-3 cursor-pointer transition-all text-left"
          >
            <Checkbox checked={true} className="mt-0.5 pointer-events-none" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-primary">{name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Custom item</span>
            </div>
          </button>
        ))}

        {/* Predefined options */}
        {options.map((opt) => {
          const isChecked = selected.includes(opt.name);
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => toggle(opt.name)}
              className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer transition-all text-left ${
                isChecked
                  ? "border-primary bg-primary/15 shadow-sm shadow-primary/10"
                  : "border-border bg-secondary hover:border-primary/40"
              }`}
            >
              <Checkbox checked={isChecked} className="mt-0.5 pointer-events-none" />
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-medium ${isChecked ? "text-primary" : "text-foreground"}`}>
                  {opt.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add custom item */}
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
            <button
              type="button"
              onClick={addCustomItem}
              disabled={!customName.trim()}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={() => { setShowInput(false); setCustomName(""); }}
              className="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
            >
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
    </div>
  );
};

export default MultiSelectGrid;
