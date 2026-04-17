import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { FONT_BODY, FONT_DISPLAY } from "../../fonts";

export const AP_Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const titleOp = interpolate(frame, [18, 36], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 18, fps, config: { damping: 22 } }), [0, 1], [40, 0]);

  const lineW = interpolate(frame, [40, 70], [0, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subOp = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [55, 80], [25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Img
        src={staticFile("images/logo.png")}
        style={{
          width: 180,
          height: 180,
          objectFit: "contain",
          transform: `scale(${logoScale})`,
          opacity: logoOp,
          marginBottom: 30,
        }}
      />
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
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
          Add a Procedure
          <br />
          <span style={{ color: "#BF9B30" }}>in seconds.</span>
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
        <span style={{ fontFamily: FONT_BODY, fontSize: 30, color: "#BF9B30", letterSpacing: 8, fontWeight: 500, textTransform: "uppercase" }}>
          A Quick Walkthrough
        </span>
      </div>
    </AbsoluteFill>
  );
};
