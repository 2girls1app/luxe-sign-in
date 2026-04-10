import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Playfair";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [60, 0]);
  const titleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [35, 55], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [50, 80], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Logo circle */}
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "3px solid #BF9B30",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 700, color: "#BF9B30", fontFamily: displayFont, letterSpacing: 2 }}>
          1A
        </span>
      </div>

      {/* Title */}
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)` }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: "#BF9B30", fontFamily: displayFont, letterSpacing: 8, textTransform: "uppercase" }}>
          1st Assist
        </span>
      </div>

      {/* Gold line */}
      <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, transparent, #BF9B30, transparent)", marginTop: 30, marginBottom: 30 }} />

      {/* Subtitle */}
      <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)` }}>
        <span style={{ fontSize: 36, color: "#e0e0e0", fontWeight: 300, letterSpacing: 4 }}>
          See How It Works
        </span>
      </div>
    </AbsoluteFill>
  );
};
