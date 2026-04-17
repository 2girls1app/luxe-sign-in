import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface CaptionProps {
  step?: string;
  title: string;
  /** position from top of frame in px */
  top?: number;
}

export const Caption = ({ step, title, top = 90 }: CaptionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const op = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: op,
        transform: `translateY(${y}px)`,
        gap: 20,
      }}
    >
      {step && (
        <div
          style={{
            padding: "10px 26px",
            borderRadius: 999,
            border: "1px solid rgba(191,155,48,0.5)",
            background: "rgba(191,155,48,0.12)",
            backdropFilter: "blur(0px)",
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: "#BF9B30",
              letterSpacing: 6,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {step}
          </span>
        </div>
      )}
      <span
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#f4f4f4",
          letterSpacing: -1,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.15,
          textShadow: "0 4px 30px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>
    </div>
  );
};
