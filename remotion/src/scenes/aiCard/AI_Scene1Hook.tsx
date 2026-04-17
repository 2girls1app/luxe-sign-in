import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY, FONT_DISPLAY } from "../../fonts";

export const AI_Scene1Hook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sparkScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const sparkOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const titleOp = interpolate(frame, [16, 38], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(
    spring({ frame: frame - 16, fps, config: { damping: 22 } }),
    [0, 1],
    [50, 0],
  );

  const lineW = interpolate(frame, [38, 70], [0, 460], { extrapolateRight: "clamp" });

  const subOp = interpolate(frame, [55, 82], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [55, 82], [30, 0], { extrapolateRight: "clamp" });

  const ringPulse = (Math.sin(frame * 0.1) + 1) * 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Spark / AI orb */}
      <div
        style={{
          position: "relative",
          width: 220,
          height: 220,
          marginBottom: 36,
          opacity: sparkOp,
          transform: `scale(${sparkScale})`,
        }}
      >
        {/* Outer pulsing ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(191,155,48,0.4)",
            transform: `scale(${1 + ringPulse * 0.15})`,
            opacity: 1 - ringPulse * 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 30,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(191,155,48,0.9) 0%, rgba(191,155,48,0.3) 50%, transparent 80%)",
            boxShadow: "0 0 80px rgba(191,155,48,0.6), inset 0 0 40px rgba(255,215,100,0.4)",
          }}
        />
        {/* Sparkle */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 90,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 0 30px rgba(255,215,100,0.9)",
          }}
        >
          ✦
        </div>
      </div>

      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 92,
            fontWeight: 700,
            color: "#f4f4f4",
            letterSpacing: -1,
            lineHeight: 1.05,
          }}
        >
          Build a card
          <br />
          <span style={{ color: "#BF9B30" }}>with AI.</span>
        </span>
      </div>

      <div
        style={{
          width: lineW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #BF9B30, transparent)",
          marginTop: 40,
          marginBottom: 28,
        }}
      />

      <div style={{ opacity: subOp, transform: `translateY(${subY}px)` }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 28,
            color: "#BF9B30",
            letterSpacing: 6,
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          Two ways. Zero typing.
        </span>
      </div>
    </AbsoluteFill>
  );
};
