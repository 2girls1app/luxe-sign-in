import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../../fonts";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";

/**
 * Scene 2 — Two paths.
 * Shows the choice: Upload an existing card OR Prefill with AI from scratch.
 */
export const AI_Scene2TwoPaths = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const phoneOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const card1Op = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const card1Y = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 16 } }),
    [0, 1],
    [60, 0],
  );
  const card2Op = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const card2Y = interpolate(
    spring({ frame: frame - 40, fps, config: { damping: 16 } }),
    [0, 1],
    [60, 0],
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Caption step="The Choice" title="Upload — or prefill from scratch." top={120} />

      <div
        style={{
          opacity: phoneOp,
          transform: `scale(${phoneScale * 0.8})`,
          marginTop: 240,
        }}
      >
        <PhoneFrame width={620}>
          <div
            style={{
              padding: "70px 36px 36px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 26,
                color: "#999",
                fontWeight: 500,
                marginTop: 10,
              }}
            >
              Add Procedure
            </div>

            {/* Option 1 — Upload */}
            <div
              style={{
                opacity: card1Op,
                transform: `translateY(${card1Y}px)`,
                background: "linear-gradient(135deg, rgba(191,155,48,0.18), rgba(191,155,48,0.06))",
                border: "1.5px solid rgba(191,155,48,0.5)",
                borderRadius: 24,
                padding: 28,
                display: "flex",
                gap: 20,
                alignItems: "center",
                boxShadow: "0 20px 50px -20px rgba(191,155,48,0.4)",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 18,
                  background: "rgba(191,155,48,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}
              >
                📄
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 30, fontWeight: 600, color: "#f4f4f4" }}>
                  Upload Card
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 20, color: "#999", marginTop: 4 }}>
                  Photo or PDF — AI reads it
                </div>
              </div>
            </div>

            {/* Option 2 — Prefill */}
            <div
              style={{
                opacity: card2Op,
                transform: `translateY(${card2Y}px)`,
                background: "linear-gradient(135deg, rgba(191,155,48,0.18), rgba(191,155,48,0.06))",
                border: "1.5px solid rgba(191,155,48,0.5)",
                borderRadius: 24,
                padding: 28,
                display: "flex",
                gap: 20,
                alignItems: "center",
                boxShadow: "0 20px 50px -20px rgba(191,155,48,0.4)",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 18,
                  background: "rgba(191,155,48,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}
              >
                ✦
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 30, fontWeight: 600, color: "#f4f4f4" }}>
                  Prefill with AI
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 20, color: "#999", marginTop: 4 }}>
                  Just type the procedure name
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
