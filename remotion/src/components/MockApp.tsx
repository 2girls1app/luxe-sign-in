import { CSSProperties, ReactNode } from "react";
import { FONT_BODY, FONT_DISPLAY } from "../fonts";

/**
 * Mock app screens used by guided role demos. Pure JSX (no images), themed
 * to match the real app: dark bg, gold accent, rounded cards.
 *
 * The phone frame inner area is roughly 692 × 1500 (after frame padding).
 */

const GOLD = "#BF9B30";
const TEXT = "#f4f4f4";
const SUBTLE = "rgba(255,255,255,0.55)";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "1px solid rgba(255,255,255,0.08)";

const screenBase: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(180deg, #0b0b0b 0%, #111111 100%)",
  color: TEXT,
  fontFamily: FONT_BODY,
  position: "relative",
  overflow: "hidden",
  padding: "70px 28px 30px 28px",
  boxSizing: "border-box",
};

const StatusBar = () => (
  <div
    style={{
      position: "absolute",
      top: 14,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "space-between",
      padding: "0 32px",
      fontFamily: FONT_BODY,
      fontSize: 13,
      color: TEXT,
      opacity: 0.7,
      zIndex: 10,
    }}
  >
    <span style={{ fontWeight: 600 }}>9:41</span>
    <span>● ● ●</span>
  </div>
);

const TopBar = ({ title, back = false }: { title: string; back?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    }}
  >
    {back ? (
      <span style={{ fontSize: 22, color: GOLD, letterSpacing: 4, fontWeight: 600 }}>‹ BACK</span>
    ) : (
      <div style={{ width: 60 }} />
    )}
    <span style={{ fontSize: 18, fontWeight: 600, color: TEXT, letterSpacing: 0.5 }}>{title}</span>
    <div style={{ width: 60, textAlign: "right" }}>
      <span style={{ fontSize: 22, color: SUBTLE }}>⌂</span>
    </div>
  </div>
);

const Section = ({ children, title }: { children: ReactNode; title?: string }) => (
  <div style={{ marginBottom: 22 }}>
    {title && (
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

/* ─────────────────────── Screens ─────────────────────── */

interface DashboardProps {
  roleLabel: string;
  userName: string;
  facility: string;
  /** ids that should appear "highlighted" (e.g. boxed gold) */
  spotlightId?: string;
}

export const ClinicalDashboardScreen = ({
  roleLabel,
  userName,
  facility,
  spotlightId,
}: DashboardProps) => (
  <div style={screenBase}>
    <StatusBar />
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #BF9B30, #8a6d1d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 22,
          color: "#0b0b0b",
        }}
      >
        {userName
          .split(" ")
          .map((s) => s[0])
          .join("")}
      </div>
      <div>
        <div style={{ fontSize: 13, color: SUBTLE, letterSpacing: 2, textTransform: "uppercase" }}>
          {roleLabel}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{userName}</div>
        <div style={{ fontSize: 13, color: SUBTLE }}>{facility}</div>
      </div>
    </div>

    <Section title="Today's Cases">
      <CaseRow
        time="07:30"
        surgeon="Dr. Bagga"
        procedure="Lap Cholecystectomy"
        room="OR 4"
        active={spotlightId === "case-1"}
      />
      <CaseRow
        time="10:15"
        surgeon="Dr. Patel"
        procedure="Robotic Hysterectomy"
        room="OR 2"
        active={spotlightId === "case-2"}
      />
      <CaseRow
        time="13:00"
        surgeon="Dr. Reyes"
        procedure="Total Knee Arthroplasty"
        room="OR 6"
      />
    </Section>

    <Section title="Quick Access">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <QuickTile icon="❤" label="Favorites" highlight={spotlightId === "favorites"} />
        <QuickTile icon="⚙" label="Settings" />
        <QuickTile icon="✉" label="Messages" />
        <QuickTile icon="📋" label="Pref Cards" highlight={spotlightId === "pref-cards"} />
      </div>
    </Section>
  </div>
);

const CaseRow = ({
  time,
  surgeon,
  procedure,
  room,
  active = false,
}: {
  time: string;
  surgeon: string;
  procedure: string;
  room: string;
  active?: boolean;
}) => (
  <div
    style={{
      background: CARD_BG,
      border: active ? `1.5px solid ${GOLD}` : CARD_BORDER,
      borderRadius: 16,
      padding: "14px 16px",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: active ? `0 0 24px rgba(191,155,48,0.35)` : "none",
    }}
  >
    <div
      style={{
        width: 50,
        textAlign: "center",
        fontSize: 13,
        color: GOLD,
        fontWeight: 600,
      }}
    >
      {time}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>{procedure}</div>
      <div style={{ fontSize: 12, color: SUBTLE }}>
        {surgeon} • {room}
      </div>
    </div>
    <span style={{ color: SUBTLE, fontSize: 18 }}>›</span>
  </div>
);

const QuickTile = ({
  icon,
  label,
  highlight = false,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) => (
  <div
    style={{
      background: CARD_BG,
      border: highlight ? `1.5px solid ${GOLD}` : CARD_BORDER,
      borderRadius: 16,
      padding: "16px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: highlight ? "0 0 24px rgba(191,155,48,0.35)" : "none",
    }}
  >
    <span style={{ fontSize: 22, color: GOLD }}>{icon}</span>
    <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
  </div>
);

/* ─────── Doctor workspace / procedure list ─────── */

export const DoctorWorkspaceScreen = ({
  doctorName,
  spotlightId,
}: {
  doctorName: string;
  spotlightId?: string;
}) => (
  <div style={screenBase}>
    <StatusBar />
    <TopBar title="Doctor" back />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #BF9B30, #8a6d1d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 700,
          color: "#0b0b0b",
          marginBottom: 12,
        }}
      >
        {doctorName
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>
        {doctorName}
      </div>
      <div style={{ fontSize: 13, color: SUBTLE, marginTop: 4 }}>General Surgery</div>
    </div>

    <Section title="Procedures">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ProcCard label="Lap Chole" complete favorite highlight={spotlightId === "proc-1"} />
        <ProcCard label="Inguinal Hernia" complete />
        <ProcCard label="Appendectomy" />
        <ProcCard label="Bowel Resection" />
      </div>
    </Section>
  </div>
);

const ProcCard = ({
  label,
  complete = false,
  favorite = false,
  highlight = false,
}: {
  label: string;
  complete?: boolean;
  favorite?: boolean;
  highlight?: boolean;
}) => (
  <div
    style={{
      background: CARD_BG,
      border: highlight ? `1.5px solid ${GOLD}` : CARD_BORDER,
      borderRadius: 16,
      padding: "18px 14px",
      aspectRatio: "1 / 1",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: highlight ? "0 0 28px rgba(191,155,48,0.4)" : "none",
      position: "relative",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 22, color: GOLD }}>⚕</span>
      <span style={{ color: favorite ? GOLD : SUBTLE, fontSize: 18 }}>♥</span>
    </div>
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{label}</div>
      {complete && (
        <div
          style={{
            marginTop: 8,
            display: "inline-block",
            fontSize: 10,
            color: "#1a8a3a",
            background: "rgba(26,138,58,0.15)",
            padding: "3px 8px",
            borderRadius: 999,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          ✓ COMPLETE
        </div>
      )}
    </div>
  </div>
);

/* ─────── Preference Card / Procedure View ─────── */

interface PrefCardProps {
  procedure: string;
  doctor: string;
  /** which category id should glow */
  spotlightId?: string;
  /** highlight a specific item inside the open category */
  itemSpotlight?: number;
  /** optional category to render expanded as a list (Anesthesia, Supplies...) */
  expanded?: "anesthesia" | "supplies" | "instruments" | "medications" | "positioning";
}

const CATEGORIES = [
  { id: "anesthesia", icon: "💉", label: "Anesthesia" },
  { id: "positioning", icon: "🛏", label: "Positioning" },
  { id: "prep", icon: "🧴", label: "Prep" },
  { id: "medications", icon: "💊", label: "Medication" },
  { id: "supplies", icon: "📦", label: "Supplies" },
  { id: "sutures", icon: "🧵", label: "Sutures" },
  { id: "instruments", icon: "🔧", label: "Instruments" },
  { id: "equipment", icon: "🖥", label: "Equipment" },
  { id: "steps", icon: "📝", label: "Steps" },
];

const EXPANDED_CONTENT: Record<string, { title: string; items: string[] }> = {
  anesthesia: {
    title: "Anesthesia Preferences",
    items: [
      "General — Endotracheal",
      "Induction: Propofol 2 mg/kg",
      "Maintenance: Sevoflurane",
      "Antibiotic: Ancef 2g pre-incision",
      "Reversal: Sugammadex 2 mg/kg",
    ],
  },
  supplies: {
    title: "Supplies",
    items: [
      "Veress needle",
      "5 mm trocar × 3",
      "12 mm trocar × 1",
      "Endo-clip applier (medium)",
      "Endocatch bag",
      "Suction/irrigation tip",
    ],
  },
  instruments: {
    title: "Instruments & Setup",
    items: [
      "Lap Chole pan (preferred set)",
      "Maryland dissector",
      "Atraumatic graspers × 2",
      "L-hook electrocautery",
      "Hemoclip applier",
      "Mayo stand setup at patient's right",
    ],
  },
  medications: {
    title: "Medications",
    items: [
      "Local: Bupivacaine 0.5% — 20 mL",
      "Toradol 30 mg IV pre-closure",
      "Ondansetron 4 mg IV",
      "Heparin SQ 5000 units pre-op",
    ],
  },
  positioning: {
    title: "Positioning",
    items: [
      "Supine, both arms tucked",
      "Reverse Trendelenburg ~15°",
      "Left tilt for exposure",
      "SCDs both legs",
      "Foam head ring, gel chest pad",
    ],
  },
};

export const PreferenceCardScreen = ({
  procedure,
  doctor,
  spotlightId,
  itemSpotlight,
  expanded,
}: PrefCardProps) => (
  <div style={screenBase}>
    <StatusBar />
    <TopBar title="Preference Card" back />

    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: SUBTLE, letterSpacing: 3, textTransform: "uppercase" }}>
        {doctor}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, marginTop: 2 }}>
        {procedure}
      </div>
      <div
        style={{
          marginTop: 8,
          display: "inline-block",
          fontSize: 10,
          color: "#1a8a3a",
          background: "rgba(26,138,58,0.15)",
          padding: "4px 10px",
          borderRadius: 999,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        ✓ CARD COMPLETE
      </div>
    </div>

    {expanded ? (
      <ExpandedCategory
        title={EXPANDED_CONTENT[expanded].title}
        items={EXPANDED_CONTENT[expanded].items}
        itemSpotlight={itemSpotlight}
      />
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {CATEGORIES.map((c) => (
          <CategoryTile
            key={c.id}
            icon={c.icon}
            label={c.label}
            highlight={spotlightId === c.id}
          />
        ))}
      </div>
    )}
  </div>
);

const CategoryTile = ({
  icon,
  label,
  highlight = false,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) => (
  <div
    style={{
      background: CARD_BG,
      border: highlight ? `1.5px solid ${GOLD}` : CARD_BORDER,
      borderRadius: 14,
      aspectRatio: "1 / 1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      boxShadow: highlight ? "0 0 28px rgba(191,155,48,0.45)" : "none",
    }}
  >
    <span style={{ fontSize: 28 }}>{icon}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, textAlign: "center" }}>{label}</span>
  </div>
);

const ExpandedCategory = ({
  title,
  items,
  itemSpotlight,
}: {
  title: string;
  items: string[];
  itemSpotlight?: number;
}) => (
  <div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: GOLD,
        marginBottom: 14,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const active = itemSpotlight === i;
        return (
          <div
            key={i}
            style={{
              background: CARD_BG,
              border: active ? `1.5px solid ${GOLD}` : CARD_BORDER,
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 15,
              color: TEXT,
              boxShadow: active ? "0 0 24px rgba(191,155,48,0.35)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: GOLD,
                opacity: 0.85,
                flexShrink: 0,
              }}
            />
            {item}
          </div>
        );
      })}
    </div>
  </div>
);

/* ─────── Task lists (PA pre/post op) ─────── */

interface TaskListProps {
  title: string;
  tasks: { label: string; done?: boolean }[];
  spotlightIndex?: number;
}

export const TaskListScreen = ({ title, tasks, spotlightIndex }: TaskListProps) => (
  <div style={screenBase}>
    <StatusBar />
    <TopBar title={title} back />
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: GOLD,
        marginBottom: 14,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tasks.map((t, i) => {
        const active = spotlightIndex === i;
        return (
          <div
            key={i}
            style={{
              background: CARD_BG,
              border: active ? `1.5px solid ${GOLD}` : CARD_BORDER,
              borderRadius: 14,
              padding: "16px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: active ? "0 0 24px rgba(191,155,48,0.35)" : "none",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${t.done ? GOLD : "rgba(255,255,255,0.3)"}`,
                background: t.done ? GOLD : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0b0b0b",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {t.done && "✓"}
            </div>
            <span
              style={{
                fontSize: 15,
                color: TEXT,
                textDecoration: t.done ? "line-through" : "none",
                opacity: t.done ? 0.55 : 1,
              }}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);
