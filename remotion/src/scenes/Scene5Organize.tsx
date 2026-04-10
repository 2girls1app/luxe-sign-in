import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene5Organize = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const categories = [
    { icon: "🔧", name: "Instruments", count: "12 items" },
    { icon: "📦", name: "Supplies", count: "8 items" },
    { icon: "💊", name: "Medications", count: "5 items" },
    { icon: "🧤", name: "Gloves", count: "Size 7.5" },
    { icon: "🧴", name: "Skin Prep", count: "Betadine" },
    { icon: "🪡", name: "Sutures", count: "3 types" },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ opacity: headerOp, marginBottom: 50, textAlign: "center" }}>
        <span style={{ fontSize: 28, color: "#BF9B30", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>
          Organized
        </span>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 48, color: "#f0f0f0", fontWeight: 700 }}>
            Everything in Place
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: 800 }}>
        {categories.map((cat, i) => {
          const cardOp = interpolate(frame, [15 + i * 8, 28 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cardScale = spring({ frame: frame - (15 + i * 8), fps, config: { damping: 14 } });

          return (
            <div
              key={cat.name}
              style={{
                opacity: cardOp,
                transform: `scale(${cardScale})`,
                background: "linear-gradient(135deg, #1a1a1a, #222)",
                borderRadius: 18,
                border: "1px solid rgba(191,155,48,0.2)",
                padding: "28px 24px",
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div style={{ fontSize: 36 }}>{cat.icon}</div>
              <div>
                <div><span style={{ fontSize: 24, color: "#e0e0e0", fontWeight: 600 }}>{cat.name}</span></div>
                <div style={{ marginTop: 4 }}><span style={{ fontSize: 18, color: "#BF9B30" }}>{cat.count}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
