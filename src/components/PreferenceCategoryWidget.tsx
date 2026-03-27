import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  Pill, Hand, RotateCcw, Droplets, Wrench, Scissors, LayoutGrid, Package, Ribbon,
} from "lucide-react";

export interface PreferenceCategory {
  key: string;
  label: string;
  icon: React.ElementType;
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  { key: "medication", label: "Medication", icon: Pill },
  { key: "gloves", label: "Gloves", icon: Hand },
  { key: "position", label: "Position", icon: RotateCcw },
  { key: "skin_prep", label: "Skin Prep", icon: Droplets },
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "instruments", label: "Instruments", icon: Scissors },
  { key: "trays", label: "Trays", icon: LayoutGrid },
  { key: "supplies", label: "Supplies", icon: Package },
  { key: "suture", label: "Suture", icon: Ribbon },
];

interface PreferenceCategoryWidgetProps {
  category: PreferenceCategory;
  value?: string;
  updatedAt?: string;
  onClick: () => void;
  index: number;
}

const PreferenceCategoryWidget = ({ category, value, onClick, index }: PreferenceCategoryWidgetProps) => {
  const Icon = category.icon;
  const hasValue = !!value;

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
      {hasValue && (
        <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
          {value}
        </span>
      )}
    </motion.button>
  );
};

export default PreferenceCategoryWidget;
