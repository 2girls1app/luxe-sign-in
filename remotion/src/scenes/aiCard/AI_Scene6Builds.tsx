import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../../fonts";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";

interface CategoryRow {
  icon: string;
  label: string;
  count: string;
}

const CATEGORIES: CategoryRow[] = [
  { icon: "🔬", label: "Instruments", count: "12 items" },
  { icon: "🧵", label: "Sutures", count: "5 types" },
  { icon: "💊", label: "Medications", count: "8 items" },
  { icon: "📋", label: "Steps", count: "7 steps" },
  { icon: "🧤", label: "Gloves", count: "Sized" },
  { icon: "💉", label: "Anesthesia", count: "Set" },
];

/**
 * Scene 6 — Card builds itself.
 * Categories pop in one by one, each with a checkmark.
 */
export const AI_Scene6Builds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Caption step="The Magic" title="Your card, fully built." top={120} />

      <div
        style={{
          opacity: phoneOp,
          marginTop: 240,
        }}
      >
        <PhoneFrame width={620}>
          <div
            style={{
              padding: "70px 28px 28px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 26,
                color: "#f4f4f4",
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              Lap Cholecystectomy
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 18,
                color: "#BF9B30",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Preference Card
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridAutoRows: "200px",
                gap: 14,
              }}
            >
              {CATEGORIES.map((cat, i) => {
                const start = 20 + i * 12;
                const op = interpolate(frame, [start, start + 14], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const popScale = spring({
                  frame: frame - start,
                  fps,
                  config: { damping: 12, stiffness: 130 },
                });
                const checkOp = interpolate(frame, [start + 10, start + 24], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={cat.label}
                    style={{
                      opacity: op,
                      transform: `scale(${popScale})`,
                      background: "linear-gradient(135deg, rgba(191,155,48,0.12), rgba(191,155,48,0.04))",
                      border: "1px solid rgba(191,155,48,0.4)",
                      borderRadius: 18,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      position: "relative",
                      aspectRatio: "1",
                      boxShadow: "0 10px 25px -10px rgba(191,155,48,0.25)",
                    }}
                  >
                    {/* Checkmark badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#BF9B30",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: checkOp,
                        transform: `scale(${checkOp})`,
                        boxShadow: "0 0 20px rgba(191,155,48,0.7)",
                      }}
                    >
                      <span style={{ color: "#0a0a0a", fontSize: 16, fontWeight: 900 }}>✓</span>
                    </div>
                    <div style={{ fontSize: 36 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }} />
                    <div
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#f4f4f4",
                      }}
                    >
                      {cat.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 14,
                        color: "#999",
                      }}
                    >
                      {cat.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
