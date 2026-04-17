import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../../fonts";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";

/**
 * Scene 3 — Path A: Upload.
 * Shows uploading a PDF/photo of an existing card.
 */
export const AI_Scene3Upload = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 22 } }),
    [0, 1],
    [40, 0],
  );

  // Document slides in from below the phone
  const docY = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } }),
    [0, 1],
    [400, 0],
  );
  const docOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // Tap dot on Choose File button
  const tapStart = 55;
  const local = frame - tapStart;
  const ringPhase = local > 0 ? (local % 32) / 32 : 0;
  const ringScale = interpolate(ringPhase, [0, 1], [0.6, 1.7]);
  const ringOp = local > 0 ? interpolate(ringPhase, [0, 0.85], [0.85, 0]) : 0;

  // Upload progress bar
  const progress = interpolate(frame, [70, 110], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Caption step="Path A" title="Upload an existing card." top={120} />

      <div
        style={{
          opacity: phoneOp,
          transform: `translateY(${phoneY}px)`,
          marginTop: 280,
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
              gap: 22,
            }}
          >
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 24,
                color: "#BF9B30",
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 10,
              }}
            >
              Upload Preference Card
            </div>

            {/* Drop zone with sliding doc */}
            <div
              style={{
                flex: 1,
                border: "2px dashed rgba(191,155,48,0.4)",
                borderRadius: 24,
                background: "rgba(191,155,48,0.04)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  opacity: docOp,
                  transform: `translateY(${docY}px)`,
                  width: 200,
                  height: 260,
                  background: "linear-gradient(135deg, #f4f4f4, #d8d8d8)",
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7)",
                  position: "relative",
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 6,
                      width: i % 3 === 0 ? "55%" : i % 2 === 0 ? "85%" : "70%",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 3,
                      marginBottom: 12,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "#BF9B30",
                    color: "#000",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontFamily: FONT_BODY,
                  }}
                >
                  PDF
                </div>
              </div>
            </div>

            {/* Choose File button */}
            <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #BF9B30, #d4ad3a)",
                borderRadius: 16,
                padding: "20px 32px",
                textAlign: "center",
                fontFamily: FONT_BODY,
                fontSize: 24,
                fontWeight: 600,
                color: "#0a0a0a",
                boxShadow: "0 10px 30px -10px rgba(191,155,48,0.6)",
              }}
            >
              Choose File
              {/* Tap ripple */}
              {local > 0 && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 100,
                      height: 100,
                      marginLeft: -50,
                      marginTop: -50,
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

            {/* Upload progress */}
            <div
              style={{
                opacity: frame > 70 ? 1 : 0,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                height: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #BF9B30, #ffd770)",
                  boxShadow: "0 0 20px rgba(191,155,48,0.6)",
                }}
              />
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
