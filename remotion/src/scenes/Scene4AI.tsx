import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene4AI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Upload animation
  const docScale = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const docOp = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scanning line
  const scanY = interpolate(frame, [35, 70], [0, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scanOp = interpolate(frame, [35, 40, 65, 70], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Results
  const resultOp = interpolate(frame, [70, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const resultScale = spring({ frame: frame - 70, fps, config: { damping: 18 } });

  const items = ["Instruments", "Supplies", "Medications", "Steps"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ opacity: headerOp, marginBottom: 50, textAlign: "center" }}>
        <span style={{ fontSize: 28, color: "#BF9B30", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>
          AI-Powered
        </span>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 48, color: "#f0f0f0", fontWeight: 700 }}>
            Upload & Extract
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 26, color: "#999" }}>
            PDF • Image • Photo
          </span>
        </div>
      </div>

      {/* Document mockup */}
      <div style={{ position: "relative", opacity: docOp, transform: `scale(${docScale})` }}>
        <div
          style={{
            width: 500,
            height: 320,
            background: "linear-gradient(135deg, #1e1e1e, #2a2a2a)",
            borderRadius: 20,
            border: "1px solid rgba(191,155,48,0.3)",
            padding: 30,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Fake text lines */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: 10,
                width: `${70 + Math.sin(i) * 20}%`,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 5,
                marginBottom: 14,
              }}
            />
          ))}

          {/* Scan line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: scanY,
              width: "100%",
              height: 3,
              background: "linear-gradient(90deg, transparent, #BF9B30, transparent)",
              opacity: scanOp,
              boxShadow: "0 0 20px rgba(191,155,48,0.5)",
            }}
          />
        </div>
      </div>

      {/* Extracted results */}
      <div style={{ opacity: resultOp, transform: `scale(${resultScale})`, marginTop: 40, display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {items.map((item, i) => {
          const itemOp = interpolate(frame, [75 + i * 5, 85 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={item}
              style={{
                opacity: itemOp,
                background: "rgba(191,155,48,0.12)",
                border: "1px solid rgba(191,155,48,0.3)",
                borderRadius: 14,
                padding: "14px 28px",
              }}
            >
              <span style={{ fontSize: 22, color: "#BF9B30", fontWeight: 600 }}>✓ {item}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
