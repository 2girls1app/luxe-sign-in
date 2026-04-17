import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

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
      {/* Logo — same as sign-in page */}
      <Img
        src={staticFile("images/logo.png")}
        style={{
          width: 220,
          height: 220,
          objectFit: "contain",
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      />

      {/* Title */}
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)` }}>
        <span style={{ fontSize: 72, fontWeight: 700, fontStyle: "italic", color: "#BF9B30", letterSpacing: 12, textTransform: "uppercase" }}>
          First Assist
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
