import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY, FONT_DISPLAY } from "../../fonts";

export const AI_Scene7Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({ frame, fps, config: { damping: 10, stiffness: 110 } });
  const checkOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const titleOp = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(
    spring({ frame: frame - 18, fps, config: { damping: 22 } }),
    [0, 1],
    [40, 0],
  );

  const lineW = interpolate(frame, [38, 70], [0, 460], { extrapolateRight: "clamp" });

  const subOp = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [60, 85], [25, 0], { extrapolateRight: "clamp" });

  const ringPulse = (Math.sin(frame * 0.12) + 1) * 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glowing check */}
      <div
        style={{
          position: "relative",
          width: 240,
          height: 240,
          marginBottom: 40,
          opacity: checkOp,
          transform: `scale(${checkScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(191,155,48,0.5)",
            transform: `scale(${1 + ringPulse * 0.18})`,
            opacity: 1 - ringPulse * 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 30,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(191,155,48,0.95) 0%, rgba(191,155,48,0.25) 60%, transparent 85%)",
            boxShadow: "0 0 100px rgba(191,155,48,0.7)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 110,
            color: "#0a0a0a",
            fontWeight: 900,
            textShadow: "0 0 20px rgba(255,255,255,0.4)",
          }}
        >
          ✓
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
            fontSize: 84,
            fontWeight: 700,
            color: "#f4f4f4",
            letterSpacing: -1,
            lineHeight: 1.05,
          }}
        >
          Done in
          <br />
          <span style={{ color: "#BF9B30" }}>seconds.</span>
        </span>
      </div>

      <div
        style={{
          width: lineW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #BF9B30, transparent)",
          marginTop: 36,
          marginBottom: 24,
        }}
      />

      <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, textAlign: "center" }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 26,
            color: "#BF9B30",
            letterSpacing: 8,
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          Edit anything · Save · Done
        </span>
      </div>
    </AbsoluteFill>
  );
};
