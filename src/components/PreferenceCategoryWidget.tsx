import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  Pill, Hand, RotateCcw, Droplets, Wrench, Scissors, LayoutGrid, Package, Ribbon,
  Image, Video, FileText, ListOrdered, Bot,
} from "lucide-react";

export interface PreferenceCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  type?: "text" | "file";
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  { key: "medication", label: "Medication", icon: Pill },
  { key: "gloves", label: "Gloves", icon: Hand },
  { key: "position", label: "Position", icon: RotateCcw },
  { key: "skinprep", label: "Skin Prep", icon: Droplets },
  
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "instruments", label: "Instruments", icon: Scissors },
  { key: "robotic_instruments", label: "Robotic", icon: Bot },
  { key: "trays", label: "Trays", icon: LayoutGrid },
  { key: "supplies", label: "Supplies", icon: Package },
  { key: "suture", label: "Suture", icon: Ribbon },
  
  { key: "images", label: "Images", icon: Image, type: "file" },
  { key: "videos", label: "Videos", icon: Video, type: "file" },
  { key: "pdfs", label: "PDFs", icon: FileText, type: "file" },
];

interface PreferenceCategoryWidgetProps {
  category: PreferenceCategory;
  value?: string;
  fileCount?: number;
  updatedAt?: string;
  onClick: () => void;
  index: number;
  pendingCount?: number;
}

const PreferenceCategoryWidget = ({ category, value, fileCount, onClick, index, pendingCount }: PreferenceCategoryWidgetProps) => {
  const Icon = category.icon;
  const isFile = category.type === "file";
  const isMedication = category.key === "medication";
  const isSteps = category.key === "steps";

  const summarizeNames = (names: string[]) => {
    if (names.length === 0) return null;
    if (names.length === 1) return names[0];
    return `${names[0]} + 1 more`;
  };

  const extractNames = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap((item) => extractNames(item)).filter(Boolean);
    }
    if (input && typeof input === "object") {
      const record = input as Record<string, unknown>;
      const directLabel = [record.name, record.label, record.title, record.value]
        .find((entry) => typeof entry === "string" && entry.trim());
      if (typeof directLabel === "string") return [directLabel.trim()];
      return Object.values(record).flatMap((entry) => extractNames(entry)).filter(Boolean);
    }
    if (typeof input === "string") {
      const trimmed = input.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  };

  const parseStructuredValue = (raw: string): unknown => {
    let current: unknown = raw.trim();
    for (let i = 0; i < 3 && typeof current === "string"; i += 1) {
      const text = current.trim();
      const looksStructured = text.startsWith("[") || text.startsWith("{") || text.startsWith('"[') || text.startsWith('"{');
      if (!looksStructured) break;
      try { current = JSON.parse(text); } catch { break; }
    }
    return current;
  };

  const getPreviewText = (): string | null => {
    if (!value?.trim()) return null;
    const raw = value.trim();
    const parsed = parseStructuredValue(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "No items selected";
      if (isMedication) return `${parsed.length} med${parsed.length !== 1 ? "s" : ""}`;
      if (isSteps) return `${parsed.length} step${parsed.length !== 1 ? "s" : ""}`;
      return summarizeNames(extractNames(parsed)) || `${parsed.length} items selected`;
    }
    if (parsed && typeof parsed === "object") {
      return summarizeNames(extractNames(parsed)) || "1 item selected";
    }
    if (typeof parsed === "string" && parsed !== raw) {
      const normalized = parsed.trim();
      if (!normalized) return "No items selected";
      return normalized;
    }
    const extractedFromRaw = Array.from(raw.matchAll(/"name"\s*:\s*"([^"]+)"/g), (match) => match[1]?.trim()).filter(Boolean);
    if (extractedFromRaw.length > 0) return summarizeNames(extractedFromRaw) || "Items selected";
    if (raw.startsWith("[") || raw.startsWith("{")) return "Items selected";
    return raw;
  };

  const hasValue = isFile ? (fileCount !== undefined && fileCount > 0) : !!value;
  const previewText = isFile
    ? (hasValue ? `${fileCount} file${fileCount !== 1 ? "s" : ""}` : "No files")
    : (getPreviewText() || "Not set");

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="relative flex flex-col items-center rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
    >
      {/* Icon area */}
      <div className="w-full flex items-center justify-center py-5 bg-primary/5">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon size={24} className="text-primary" />
        </div>
      </div>

      {/* Content area */}
      <div className="w-full flex flex-col items-center gap-1 px-3 py-3">
        <span className="text-sm font-semibold text-foreground leading-tight tracking-tight">
          {category.label}
        </span>
        <span className="text-[11px] text-muted-foreground truncate max-w-full leading-tight">
          {previewText}
        </span>
      </div>

      {/* Status indicators */}
      {hasValue && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
          <Check size={12} className="text-primary-foreground" />
        </span>
      )}

      {pendingCount !== undefined && pendingCount > 0 && (
        <span className="absolute top-2 left-2 min-w-[20px] h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black px-1.5">
          {pendingCount}
        </span>
      )}
    </motion.button>
  );
};

export default PreferenceCategoryWidget;
