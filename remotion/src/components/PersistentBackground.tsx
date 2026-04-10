import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, 40]);
  const pulse = Math.sin(frame * 0.02) * 0.05 + 0.15;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #141414 50%, #1a1608 100%)" }}>
      {/* Subtle gold orb top-right */}
      <div
        style={{
          position: "absolute",
          top: -200 + drift,
          right: -150,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(191,155,48,${pulse}) 0%, transparent 70%)`,
        }}
      />
      {/* Subtle gold orb bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: -100 - drift * 0.5,
          left: -200,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(191,155,48,${pulse * 0.6}) 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
