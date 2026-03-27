import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectOption {
  name: string;
  desc: string;
}

interface MultiSelectGridProps {
  options: MultiSelectOption[];
  value: string;
  onChange: (value: string) => void;
}

const MultiSelectGrid = ({ options, value, onChange }: MultiSelectGridProps) => {
  const selected = value.split(", ").filter(Boolean);

  const toggle = (name: string) => {
    const isChecked = selected.includes(name);
    const next = isChecked
      ? selected.filter((s) => s !== name)
      : [...selected, name];
    onChange(next.join(", "));
  };

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};

export default MultiSelectGrid;
