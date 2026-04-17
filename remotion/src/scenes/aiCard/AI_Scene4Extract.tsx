import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../../fonts";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";

/**
 * Scene 4 — AI extraction.
 * Shows scanning effect on the document and AI thinking.
 */
export const AI_Scene4Extract = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const phoneScale = spring({ frame, fps, config: { damping: 22 } });

  // Scan line moves down repeatedly
  const scanY = interpolate((frame * 4) % 100, [0, 100], [0, 360]);
  const scanOp = frame > 12 ? 1 : 0;

  // Floating extracted tags
  const tags = ["Instruments", "Sutures", "Medications", "Steps"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Caption step="AI extraction" title="Reading every line." top={120} />

      <div
        style={{
          opacity: phoneOp,
          transform: `scale(${0.9 * phoneScale})`,
          marginTop: 240,
          position: "relative",
        }}
      >
        <PhoneFrame width={580}>
          <div
            style={{
              padding: "70px 28px 28px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 22,
                color: "#BF9B30",
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>✦</span>
              Analyzing with AI…
            </div>

            {/* Document being scanned */}
            <div
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #f4f4f4, #e0e0e0)",
                borderRadius: 16,
                padding: 22,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Faux preference card content */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)", marginBottom: 12, letterSpacing: 1 }}>
                PREFERENCE CARD
              </div>
              {Array.from({ length: 22 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 7,
                    width: i % 5 === 0 ? "45%" : i % 3 === 0 ? "60%" : i % 2 === 0 ? "88%" : "75%",
                    background: i % 5 === 0 ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.22)",
                    borderRadius: 3,
                    marginBottom: i % 5 === 0 ? 14 : 10,
                  }}
                />
              ))}
              {/* Scan line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: scanY,
                  height: 4,
                  background: "linear-gradient(90deg, transparent, #BF9B30, transparent)",
                  boxShadow: "0 0 20px rgba(191,155,48,0.9), 0 0 40px rgba(191,155,48,0.5)",
                  opacity: scanOp,
                }}
              />
              {/* Scan glow trail */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: scanY,
                  background:
                    "linear-gradient(180deg, rgba(191,155,48,0.05) 0%, rgba(191,155,48,0.2) 100%)",
                  opacity: scanOp * 0.5,
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Extracted tags floating up */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, minHeight: 80 }}>
              {tags.map((t, i) => {
                const start = 25 + i * 14;
                const op = interpolate(frame, [start, start + 14], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const y = interpolate(
                  spring({ frame: frame - start, fps, config: { damping: 14 } }),
                  [0, 1],
                  [30, 0],
                );
                return (
                  <div
                    key={t}
                    style={{
                      opacity: op,
                      transform: `translateY(${y}px)`,
                      background: "rgba(191,155,48,0.18)",
                      border: "1px solid rgba(191,155,48,0.5)",
                      borderRadius: 999,
                      padding: "8px 18px",
                      fontFamily: FONT_BODY,
                      fontSize: 18,
                      color: "#BF9B30",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✓</span>
                    {t}
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
