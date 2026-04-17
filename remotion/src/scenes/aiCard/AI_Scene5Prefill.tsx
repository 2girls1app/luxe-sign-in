import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../../fonts";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";

/**
 * Scene 5 — Path B: Prefill with AI from scratch.
 * Shows typing a procedure name and the Prefill button being tapped.
 */
export const AI_Scene5Prefill = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 22 } }),
    [0, 1],
    [40, 0],
  );

  // Typewriter effect on procedure name
  const fullText = "Lap Cholecystectomy";
  const charCount = Math.floor(interpolate(frame, [22, 70], [0, fullText.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const typedText = fullText.slice(0, charCount);
  const showCursor = Math.floor(frame / 8) % 2 === 0;

  // Tap on Prefill button
  const tapStart = 80;
  const local = frame - tapStart;
  const ringPhase = local > 0 ? (local % 32) / 32 : 0;
  const ringScale = interpolate(ringPhase, [0, 1], [0.6, 1.7]);
  const ringOp = local > 0 ? interpolate(ringPhase, [0, 0.85], [0.85, 0]) : 0;

  // Button press pulse
  const buttonGlow = local > 0 ? Math.sin(local * 0.3) * 0.3 + 0.7 : 0.7;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Caption step="Path B" title="Or type a name. AI does the rest." top={120} />

      <div
        style={{
          opacity: phoneOp,
          transform: `translateY(${phoneY}px)`,
          marginTop: 280,
        }}
      >
        <PhoneFrame width={580}>
          <div
            style={{
              padding: "70px 28px 28px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 22,
                color: "#999",
                fontWeight: 500,
                marginTop: 6,
              }}
            >
              New Procedure
            </div>

            {/* Procedure name input */}
            <div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 18,
                  color: "#BF9B30",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                Procedure Name
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(191,155,48,0.4)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  fontFamily: FONT_BODY,
                  fontSize: 28,
                  color: "#f4f4f4",
                  minHeight: 36,
                  boxShadow: "0 0 30px -10px rgba(191,155,48,0.3)",
                }}
              >
                {typedText}
                {showCursor && (
                  <span style={{ color: "#BF9B30", fontWeight: 300 }}>|</span>
                )}
              </div>
            </div>

            {/* Specialty (auto) */}
            <div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 18,
                  color: "#666",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                Specialty
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "16px 22px",
                  fontFamily: FONT_BODY,
                  fontSize: 22,
                  color: "#999",
                }}
              >
                General Surgery
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Prefill with AI button */}
            <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #BF9B30, #ffd770)",
                borderRadius: 16,
                padding: "22px 32px",
                textAlign: "center",
                fontFamily: FONT_BODY,
                fontSize: 26,
                fontWeight: 700,
                color: "#0a0a0a",
                boxShadow: `0 10px 40px -10px rgba(191,155,48,${buttonGlow})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>✦</span>
              Prefill with AI
              {local > 0 && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 110,
                      height: 110,
                      marginLeft: -55,
                      marginTop: -55,
                      borderRadius: "50%",
                      border: "3px solid rgba(255,255,255,0.9)",
                      transform: `scale(${ringScale})`,
                      opacity: ringOp,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 22,
                      height: 22,
                      marginLeft: -11,
                      marginTop: -11,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 0 20px rgba(255,255,255,0.9)",
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
