import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  Pill, Hand, RotateCcw, Droplets, Wrench, Scissors, LayoutGrid, Package, Ribbon,
  Image, Video, FileText, ListOrdered, Bot, UserCheck, Stethoscope,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export interface PreferenceCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  type?: "text" | "file";
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  { key: "anesthesia", label: "Anesthesia", icon: Stethoscope },
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
  { key: "sales_rep", label: "Sales Rep", icon: UserCheck },
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

    // Special handling for anesthesia JSON format
    if (category.key === "anesthesia") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const parts: string[] = [];
          if (parsed.meds?.length) parts.push(`${parsed.meds.length} med${parsed.meds.length !== 1 ? "s" : ""}`);
          if (parsed.antibiotics?.length) parts.push(`${parsed.antibiotics.length} abx`);
          if (parsed.tube) parts.push(parsed.tube);
          if (parsed.paralyze) parts.push(`Para: ${parsed.paralyze}`);
          return parts.length > 0 ? parts.join(", ") : null;
        }
      } catch { /* fallback */ }
    }

    // Special handling for gloves JSON format
    if (category.key === "gloves") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const parts: string[] = [];
          if (parsed.doctor) parts.push(`Dr: ${parsed.doctor}`);
          if (parsed.first_assist) parts.push(`FA: ${parsed.first_assist}`);
          return parts.length > 0 ? parts.join(", ") : null;
        }
      } catch { /* fallback to raw */ }
      return raw;
    }

    // Special handling for sales_rep JSON format
    if (category.key === "sales_rep") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          const parts: string[] = [];
          if (first.company) parts.push(first.company);
          if (first.rep_name) parts.push(first.rep_name);
          const summary = parts.join(" – ") || "1 rep";
          return parsed.length > 1 ? `${summary} +${parsed.length - 1}` : summary;
        }
      } catch { /* fallback */ }
    }

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
      className="relative flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-card border border-border p-4 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 aspect-square"
    >
      {hasValue && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
          <Check size={12} className="text-primary-foreground" />
        </span>
      )}

      {pendingCount !== undefined && pendingCount > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute top-2.5 left-2.5 min-w-[18px] h-[18px] rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-destructive-foreground px-1 cursor-default">
                {pendingCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Pending doctor approval
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon size={22} className="text-primary" />
      </div>

      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className="text-xs font-semibold text-foreground leading-tight">{category.label}</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-full px-1 leading-tight">
          {previewText}
        </span>
      </div>
    </motion.button>
  );
};

export default PreferenceCategoryWidget;
