import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene3Procedure = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const procedures = ["Total Knee Replacement", "ACL Reconstruction", "Rotator Cuff Repair"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ opacity: headerOp, marginBottom: 50, textAlign: "center" }}>
        <span style={{ fontSize: 28, color: "#BF9B30", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>
          Step 2
        </span>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 52, color: "#f0f0f0", fontWeight: 700 }}>
            Add Procedures
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 800 }}>
        {procedures.map((proc, i) => {
          const cardOp = interpolate(frame, [20 + i * 12, 35 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cardY = interpolate(frame, [20 + i * 12, 35 + i * 12], [50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const checkOp = interpolate(frame, [55 + i * 8, 65 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={proc}
              style={{
                opacity: cardOp,
                transform: `translateY(${cardY}px)`,
                background: "linear-gradient(135deg, #1e1e1e, #252525)",
                borderRadius: 18,
                border: "1px solid rgba(191,155,48,0.2)",
                padding: "30px 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(191,155,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 24, color: "#BF9B30" }}>📋</span>
                </div>
                <span style={{ fontSize: 28, color: "#e0e0e0", fontWeight: 500 }}>{proc}</span>
              </div>
              <div style={{ opacity: checkOp, width: 36, height: 36, borderRadius: "50%", background: "#BF9B30", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20, color: "#0a0a0a" }}>✓</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
