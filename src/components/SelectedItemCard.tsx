import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

export interface SelectedItemCardProps {
  /** Primary item name shown prominently */
  name: string;
  /** Inline notes shown beneath the name with a left-border accent */
  notes?: string;
  /**
   * Status / context badges (e.g. "On Hold", "Backordered", "IV").
   * Rendered between the name and the notes block.
   */
  badges?: ReactNode;
  /** Click handler for the × remove button on the right */
  onRemove?: () => void;
  /** Aria label for the remove button */
  removeLabel?: string;
  /** Optional click handler for the row body (e.g. open editor) */
  onClick?: () => void;
  /** Optional element rendered below notes (for inline editors / quantity controls) */
  children?: ReactNode;
  /** Visual highlight, e.g. when expanded */
  highlighted?: boolean;
}

/**
 * Standard "selected item" card row used across all preference card sections
 * (Medications, Equipment, Supplies, Sales Reps, Anesthesia, etc.).
 *
 * Layout pattern (consistent across the app):
 *   • gold dot indicator on the left
 *   • item name displayed prominently
 *   • status badges between name and notes
 *   • inline notes (never hidden) with a left-border accent
 *   • × remove button on the right
 */
const SelectedItemCard = ({
  name,
  notes,
  badges,
  onRemove,
  removeLabel,
  onClick,
  children,
  highlighted = false,
}: SelectedItemCardProps) => {
  const hasNotes = !!(notes && notes.trim());

  const Wrapper = onClick ? "button" : "div";

  return (
    <div
      className={`w-full sm:w-1/2 sm:max-w-md rounded-xl border bg-secondary/40 transition-all ${
        highlighted
          ? "border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
          : "border-border/60 hover:border-primary/40"
      }`}
    >
      <Wrapper
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        {/* Gold dot indicator */}
        <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />

        <div className="flex-1 min-w-0 space-y-1">
          {/* Name + inline badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">
              {name}
            </span>
            {badges}
          </div>

          {/* Inline notes (never hidden) */}
          {hasNotes && (
            <div className="border-l-2 border-primary/60 pl-2 py-0.5">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-snug">
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Remove button */}
        {onRemove && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors shrink-0"
            aria-label={removeLabel || `Remove ${name}`}
          >
            <X size={14} />
          </span>
        )}
      </Wrapper>

      {/* Expanded / editor content */}
      {children && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};

interface SelectedCountHeaderProps {
  count: number;
  label?: string;
  icon?: ReactNode;
}

/** Header row with a "{n} selected" badge — used at the top of each selected list. */
export const SelectedCountHeader = ({
  count,
  label = "Selected",
  icon,
}: SelectedCountHeaderProps) => (
  <div className="flex items-center gap-2 px-1">
    <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
      {count} selected
    </Badge>
  </div>
);

export default SelectedItemCard;
