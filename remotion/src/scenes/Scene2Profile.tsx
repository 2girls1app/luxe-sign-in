import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

export const Scene2Profile = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [0, 20], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cardScale = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 120 } });
  const cardOp = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fields = ["Name", "Specialty", "Facility"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      {/* Header */}
      <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 60, textAlign: "center" }}>
        <span style={{ fontSize: 28, color: "#BF9B30", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>
          Step 1
        </span>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 52, color: "#f0f0f0", fontWeight: 700 }}>
            Create Your Profile
          </span>
        </div>
      </div>

      {/* Card mockup */}
      <div
        style={{
          opacity: cardOp,
          transform: `scale(${cardScale})`,
          width: 800,
          background: "linear-gradient(135deg, #1e1e1e, #2a2a2a)",
          borderRadius: 24,
          border: "1px solid rgba(191,155,48,0.3)",
          padding: 50,
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #BF9B30, #8B7020)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 36, color: "#fff", fontWeight: 700 }}>Dr</span>
          </div>
          <div>
            <span style={{ fontSize: 30, color: "#f0f0f0", fontWeight: 600 }}>Dr. Sarah Johnson</span>
            <div style={{ marginTop: 6 }}><span style={{ fontSize: 22, color: "#999" }}>Orthopedic Surgery</span></div>
          </div>
        </div>

        {/* Fields animate in */}
        {fields.map((field, i) => {
          const fieldOp = interpolate(frame, [30 + i * 10, 40 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const fieldX = interpolate(frame, [30 + i * 10, 40 + i * 10], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={field} style={{ opacity: fieldOp, transform: `translateX(${fieldX}px)`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#BF9B30" }} />
              <span style={{ fontSize: 26, color: "#ccc" }}>{field}</span>
              <div style={{ flex: 1, height: 1, background: "rgba(191,155,48,0.2)", marginLeft: 10 }} />
              <div style={{ width: 180, height: 36, borderRadius: 8, background: "rgba(191,155,48,0.1)", border: "1px solid rgba(191,155,48,0.2)" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
