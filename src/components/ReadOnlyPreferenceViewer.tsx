import { Badge } from "@/components/ui/badge";
import { Pill, Check, Pause } from "lucide-react";
import { MULTI_SELECT_CATEGORIES } from "@/data/preferenceOptions";
import SelectedItemCard, { SelectedCountHeader } from "@/components/SelectedItemCard";

import supineImg from "@/assets/positions/supine.png";
import proneImg from "@/assets/positions/prone.png";
import lateralImg from "@/assets/positions/lateral.png";
import lithotomyImg from "@/assets/positions/lithotomy.png";
import trendelenburgImg from "@/assets/positions/trendelenburg.png";
import reverseTrendelenburgImg from "@/assets/positions/reverse-trendelenburg.png";
import sittingImg from "@/assets/positions/sitting.png";
import jackknifeImg from "@/assets/positions/jackknife.png";

const GLOVE_SIZES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];
const POSITIONS: { name: string; img: string }[] = [
  { name: "Supine", img: supineImg },
  { name: "Prone", img: proneImg },
  { name: "Lateral", img: lateralImg },
  { name: "Lithotomy", img: lithotomyImg },
  { name: "Trendelenburg", img: trendelenburgImg },
  { name: "Reverse Trendelenburg", img: reverseTrendelenburgImg },
  { name: "Sitting", img: sittingImg },
  { name: "Jackknife", img: jackknifeImg },
];

interface SelectedMedication {
  name: string;
  category: string;
  dosage?: string;
  route?: string;
  notes?: string;
  isCustom?: boolean;
  hold?: boolean;
  holdQty?: number;
}

interface ItemData {
  name: string;
  qty: number;
  hold?: boolean;
  holdQty?: number;
}

const parseMedications = (value: string): SelectedMedication[] => {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return value.trim() ? [{ name: value.trim(), category: "Other" }] : [];
};

const parseItems = (value: string): ItemData[] => {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.map((item: any) => ({
        name: typeof item === "string" ? item : item.name,
        qty: item.qty ?? 1,
        hold: item.hold ?? false,
        holdQty: item.holdQty ?? 1,
      }));
  } catch {}
  return value
    .split(", ")
    .filter(Boolean)
    .map((name) => ({ name, qty: 1, hold: false, holdQty: 1 }));
};

interface ReadOnlyPreferenceViewerProps {
  categoryKey: string;
  value: string;
  fileCount?: number;
}

const ReadOnlyPreferenceViewer = ({
  categoryKey,
  value,
  fileCount,
}: ReadOnlyPreferenceViewerProps) => {
  // --- Files ---
  if (categoryKey === "images" || categoryKey === "videos" || categoryKey === "pdfs") {
    const count = fileCount || 0;
    return (
      <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
        <p className="text-sm text-foreground">
          {count} file{count !== 1 ? "s" : ""} uploaded
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Files are viewable in the full preference card
        </p>
      </div>
    );
  }

  // --- Gloves ---
  if (categoryKey === "gloves") {
    let doctorSize = "";
    let firstAssistSize = "";
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        doctorSize = parsed.doctor || "";
        firstAssistSize = parsed.first_assist || "";
      } else {
        doctorSize = value;
      }
    } catch {
      doctorSize = value;
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Doctor Glove Size
          </p>
          <div className="grid grid-cols-3 gap-2">
            {GLOVE_SIZES.map((size) => (
              <div
                key={`doc-${size}`}
                className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium ${
                  doctorSize === size
                    ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-secondary text-muted-foreground/40"
                }`}
              >
                {size}
                {doctorSize === size && <Check size={14} className="ml-1.5" />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            First Assist Glove Size
          </p>
          <div className="grid grid-cols-3 gap-2">
            {GLOVE_SIZES.map((size) => (
              <div
                key={`fa-${size}`}
                className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium ${
                  firstAssistSize === size
                    ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    : "border-border bg-secondary text-muted-foreground/40"
                }`}
              >
                {size}
                {firstAssistSize === size && <Check size={14} className="ml-1.5" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Position ---
  if (categoryKey === "position") {
    let positionName = value;
    let positionNotes = "";
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "position" in parsed) {
        positionName = parsed.position || "";
        positionNotes = parsed.notes || "";
      }
    } catch { /* legacy plain-string value */ }

    return (
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Patient Position
        </p>
        <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
          {POSITIONS.map((pos) => (
            <div
              key={pos.name}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
                positionName === pos.name
                  ? "border-primary bg-primary/15 shadow-sm shadow-primary/10"
                  : "border-border bg-secondary opacity-50"
              }`}
            >
              <img
                src={pos.img}
                alt={pos.name}
                loading="lazy"
                width={100}
                height={100}
                className="w-20 h-20 object-contain"
              />
              <span
                className={`text-xs font-medium ${
                  positionName === pos.name ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {pos.name}
              </span>
              {positionName === pos.name && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px]">
                  <Check size={10} className="mr-0.5" /> Selected
                </Badge>
              )}
            </div>
          ))}
        </div>
        {positionNotes && (
          <div className="mt-3 rounded-xl border border-border bg-secondary p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{positionNotes}</p>
          </div>
        )}
      </div>
    );
  }

  // --- Medication ---
  if (categoryKey === "medication") {
    const medications = parseMedications(value);
    if (medications.length === 0) {
      return (
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No medications selected</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <SelectedCountHeader
          count={medications.length}
          label="Medications"
          icon={<Pill size={12} />}
        />
        <div className="space-y-2">
          {medications.map((med, idx) => {
            const noteParts: string[] = [];
            if (med.dosage) noteParts.push(`Dosage: ${med.dosage}`);
            if (med.route) noteParts.push(`Route: ${med.route}`);
            if (med.notes) noteParts.push(med.notes);
            const notes = noteParts.length > 0 ? noteParts.join(" • ") : undefined;

            const badges = (
              <>
                {med.isCustom && (
                  <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary px-1.5 py-0.5 uppercase tracking-wider">
                    Custom
                  </span>
                )}
                {med.hold && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400 px-1.5 py-0.5 uppercase tracking-wider">
                    <Pause size={9} />
                    On hold{med.holdQty && med.holdQty > 1 ? ` ×${med.holdQty}` : ""}
                  </span>
                )}
              </>
            );

            return (
              <SelectedItemCard
                key={`${med.name}-${idx}`}
                name={med.name}
                notes={notes}
                badges={badges}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- Multi-select categories (skinprep, equipment, instruments, robotic_instruments, trays, supplies, suture) ---
  const presetOptions = MULTI_SELECT_CATEGORIES[categoryKey];
  if (presetOptions) {
    const items = parseItems(value);
    if (items.length === 0) {
      return (
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No items selected</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Selected Items ({items.length})
        </p>
        <div className="space-y-1.5">
          {items.map((item, idx) => {
            const presetInfo = presetOptions.find(
              (o) => o.name.toLowerCase() === item.name.toLowerCase()
            );
            return (
              <div
                key={`${item.name}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  {presetInfo?.desc && (
                    <p className="text-[10px] text-muted-foreground">{presetInfo.desc}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.qty > 1 && (
                    <Badge
                      variant="outline"
                      className="text-[9px] border-primary/30 text-primary"
                    >
                      ×{item.qty}
                    </Badge>
                  )}
                  {item.hold && (
                    <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Pause size={8} className="mr-0.5" />
                      Hold{item.holdQty && item.holdQty > 1 ? ` ×${item.holdQty}` : ""}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show unselected items from preset library (dimmed) */}
        {(() => {
          const unselected = presetOptions.filter(
            (o) => !items.some((i) => i.name.toLowerCase() === o.name.toLowerCase())
          );
          if (unselected.length === 0) return null;
          return (
            <div className="mt-3">
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                Available in Library ({unselected.length})
              </p>
              <div className="space-y-1">
                {unselected.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-2.5 opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                      <p className="text-[9px] text-muted-foreground/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // --- Fallback: plain text ---
  if (!value?.trim()) {
    return (
      <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">No preference set</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Current Preference
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
};

export default ReadOnlyPreferenceViewer;
