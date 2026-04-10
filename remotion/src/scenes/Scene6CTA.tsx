import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Playfair";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const Scene6CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const circleScale = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const titleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 35], [50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const btnScale = spring({ frame: frame - 50, fps, config: { damping: 14 } });
  const btnOp = interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gentle pulse on button
  const pulse = Math.sin(frame * 0.08) * 0.03 + 1;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Decorative circle */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "2px solid rgba(191,155,48,0.15)",
          transform: `scale(${circleScale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 550,
          height: 550,
          borderRadius: "50%",
          border: "1px solid rgba(191,155,48,0.08)",
          transform: `scale(${circleScale * 0.95})`,
        }}
      />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)` }}>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#BF9B30", fontFamily: displayFont }}>
            Ready to Start?
          </span>
        </div>

        <div style={{ opacity: subOp, marginTop: 24 }}>
          <span style={{ fontSize: 30, color: "#ccc", fontWeight: 300, lineHeight: 1.6 }}>
            Build your preference cards
          </span>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 30, color: "#ccc", fontWeight: 300 }}>
              in minutes, not hours
            </span>
          </div>
        </div>

        <div style={{ opacity: btnOp, marginTop: 50, transform: `scale(${btnScale * pulse})` }}>
          <div
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #BF9B30, #D4AF37)",
              borderRadius: 16,
              padding: "22px 60px",
              boxShadow: "0 8px 30px rgba(191,155,48,0.3)",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: "#0a0a0a", letterSpacing: 2 }}>
              SIGN UP FREE
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
