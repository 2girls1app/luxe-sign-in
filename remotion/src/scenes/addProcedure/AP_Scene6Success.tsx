import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PhoneScreen } from "../../components/PhoneScreen";

const TOTAL = 130;

export const AP_Scene6Success = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeEnter = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 120 } });
  const badgeOp = interpolate(badgeEnter, [0, 1], [0, 1]);
  const badgeScale = interpolate(badgeEnter, [0, 1], [0.6, 1]);

  const headlineOp = interpolate(frame, [40, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headlineY = interpolate(frame, [40, 65], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      {/* Top success badge + headline */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            opacity: badgeOp,
            transform: `scale(${badgeScale})`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 32px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(191,155,48,0.25), rgba(191,155,48,0.1))",
            border: "1px solid rgba(191,155,48,0.6)",
            boxShadow: "0 0 60px rgba(191,155,48,0.3)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#BF9B30",
              color: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: 26, color: "#BF9B30", letterSpacing: 6, fontWeight: 600, textTransform: "uppercase" }}>
            Procedure Added
          </span>
        </div>
        <div style={{ opacity: headlineOp, transform: `translateY(${headlineY}px)`, textAlign: "center" }}>
          <span style={{ fontSize: 56, color: "#f4f4f4", fontWeight: 700, letterSpacing: -1, lineHeight: 1.15 }}>
            That’s it. <span style={{ color: "#BF9B30" }}>You’re ready.</span>
          </span>
        </div>
      </div>

      <PhoneScreen
        src="images/06-success.png"
        totalFrames={TOTAL}
        zoom={[1.04, 1.0]}
        pan={[{ x: 0, y: -10 }, { x: 0, y: 10 }]}
      />
    </AbsoluteFill>
  );
};
