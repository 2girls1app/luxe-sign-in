import { useState } from "react";
import { Plus, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

interface LockedCategoryViewProps {
  category: PreferenceCategory;
  value?: string;
  fileCount?: number;
  onRequestAdd: (category: PreferenceCategory) => void;
}

const LockedCategoryView = ({ category, value, fileCount, onRequestAdd }: LockedCategoryViewProps) => {
  const Icon = category.icon;
  const isFile = category.type === "file";

  const getSelectedItems = (): string[] => {
    if (isFile) {
      if (fileCount && fileCount > 0) return [`${fileCount} file${fileCount !== 1 ? "s" : ""}`];
      return [];
    }
    if (!value?.trim()) return [];

    // Try parsing JSON
    let parsed: unknown = value.trim();
    for (let i = 0; i < 3 && typeof parsed === "string"; i++) {
      const text = (parsed as string).trim();
      if (!text.startsWith("[") && !text.startsWith("{") && !text.startsWith('"')) break;
      try { parsed = JSON.parse(text); } catch { break; }
    }

    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const name = item.name || item.label || item.title || item.value;
          if (typeof name === "string") {
            let display = name;
            if (item.qty && item.qty > 1) display += ` (x${item.qty})`;
            if (item.hold) display += " [HOLD]";
            return display;
          }
        }
        return String(item);
      }).filter(Boolean);
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const name = record.name || record.label || record.title;
      if (typeof name === "string") return [name];
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }

    return [];
  };

  const items = getSelectedItems();

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">{category.label}</span>
          <Lock size={12} className="text-green-400/60" />
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onRequestAdd(category)}
                className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} className="text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Request addition (requires doctor approval)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20 px-2 py-0.5"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">No items selected</p>
      )}
    </div>
  );
};

export default LockedCategoryView;
