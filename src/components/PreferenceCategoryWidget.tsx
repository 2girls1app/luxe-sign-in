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
}

const formatUpdatedDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const PreferenceCategoryWidget = ({ category, value, fileCount, updatedAt, onClick, index }: PreferenceCategoryWidgetProps) => {
  const Icon = category.icon;
  const isFile = category.type === "file";
  const isMedication = category.key === "medication";
  const isSteps = category.key === "steps";

  const getPreviewText = (): string | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return null;
        if (isMedication) return `${parsed.length} med${parsed.length !== 1 ? "s" : ""}`;
        if (isSteps) return `${parsed.length} step${parsed.length !== 1 ? "s" : ""}`;
        const names = parsed.map((item: any) => (typeof item === "object" && item !== null ? (item.name || item.label || "Item") : String(item)));
        if (names.length === 1) return names[0];
        if (names.length === 2) return names.join(", ");
        return `${names[0]} + ${names.length - 1} more`;
      }
      if (typeof parsed === "object" && parsed !== null) {
        return parsed.name || parsed.label || "1 item selected";
      }
    } catch {
      // Not JSON, return as plain string
    }
    return value;
  };

  const hasValue = isFile ? (fileCount !== undefined && fileCount > 0) : !!value;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-95"
    >
      {hasValue && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check size={12} className="text-primary-foreground" />
        </span>
      )}
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon size={22} className="text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground">{category.label}</span>
      {isFile && hasValue && (
        <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
          {fileCount} file{fileCount !== 1 ? "s" : ""}
        </span>
      )}
      {!isFile && hasValue && (
        <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
          {getPreviewText()}
        </span>
      )}
    </motion.button>
  );
};

export default PreferenceCategoryWidget;
