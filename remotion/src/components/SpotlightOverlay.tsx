import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT_BODY } from "../fonts";

interface SpotlightProps {
  /** spotlight center, normalized 0-1 of full frame */
  x: number;
  y: number;
  /** spotlight radius in px */
  radius: number;
  /** tooltip text */
  tooltip: string;
  /** preferred tooltip side */
  side?: "top" | "bottom" | "left" | "right";
  /** frame to start appearing */
  fromFrame?: number;
  /** total frames */
  totalFrames: number;
  /** frame to start fading out (default: totalFrames - 12) */
  exitFrame?: number;
}

/**
 * Spotlight overlay used by guided tours: dark scrim with a soft circular cutout,
 * an animated gold ring around the highlighted region, and a captioned tooltip.
 */
export const SpotlightOverlay = ({
  x,
  y,
  radius,
  tooltip,
  side = "bottom",
  fromFrame = 0,
  totalFrames,
  exitFrame,
}: SpotlightProps) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const localFrame = frame - fromFrame;
  const exit = exitFrame ?? totalFrames - 14;

  const enterOp = interpolate(localFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOp = interpolate(frame, [exit, exit + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = enterOp * exitOp;

  const ringPulse = (Math.sin(localFrame * 0.12) + 1) / 2;
  const ringScale = 1 + ringPulse * 0.04;

  const cx = x * width;
  const cy = y * height;

  // Tooltip placement
  const ttSpring = spring({
    frame: localFrame - 6,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const ttOp = interpolate(ttSpring, [0, 1], [0, 1]) * exitOp;
  const ttOffset = interpolate(ttSpring, [0, 1], [20, 0]);

  let ttStyle: React.CSSProperties = {};
  const gap = radius + 60;
  if (side === "bottom") {
    ttStyle = {
      left: cx,
      top: cy + gap + ttOffset,
      transform: "translateX(-50%)",
    };
  } else if (side === "top") {
    ttStyle = {
      left: cx,
      top: cy - gap - 240 - ttOffset,
      transform: "translateX(-50%)",
    };
  } else if (side === "right") {
    ttStyle = {
      left: cx + gap + ttOffset,
      top: cy,
      transform: "translateY(-50%)",
    };
  } else {
    ttStyle = {
      left: cx - gap - 600 - ttOffset,
      top: cy,
      transform: "translateY(-50%)",
    };
  }

  return (
    <>
      {/* Dark scrim with circular cutout via SVG mask */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          pointerEvents: "none",
        }}
      >
        <defs>
          <radialGradient id={`spot-${fromFrame}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="55%" stopColor="black" stopOpacity="1" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </radialGradient>
          <mask id={`mask-${fromFrame}`}>
            <rect width={width} height={height} fill="white" />
            <circle cx={cx} cy={cy} r={radius * 1.9} fill={`url(#spot-${fromFrame})`} />
          </mask>
        </defs>
        <rect
          width={width}
          height={height}
          fill="black"
          opacity={0.55}
          mask={`url(#mask-${fromFrame})`}
        />
      </svg>

      {/* Gold pulsing ring around the spotlight */}
      <div
        style={{
          position: "absolute",
          left: cx - radius,
          top: cy - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: "50%",
          border: "3px solid #BF9B30",
          boxShadow:
            "0 0 60px rgba(191,155,48,0.6), inset 0 0 30px rgba(191,155,48,0.25)",
          transform: `scale(${ringScale})`,
          opacity,
          pointerEvents: "none",
        }}
      />
      {/* outer faded ring */}
      <div
        style={{
          position: "absolute",
          left: cx - radius * 1.25,
          top: cy - radius * 1.25,
          width: radius * 2.5,
          height: radius * 2.5,
          borderRadius: "50%",
          border: "1px solid rgba(191,155,48,0.35)",
          opacity: opacity * (1 - ringPulse * 0.5),
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          position: "absolute",
          ...ttStyle,
          opacity: ttOp,
          maxWidth: 600,
          minWidth: 380,
          padding: "26px 32px",
          borderRadius: 22,
          background:
            "linear-gradient(160deg, rgba(20,20,20,0.96), rgba(10,10,10,0.96))",
          border: "1px solid rgba(191,155,48,0.5)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(191,155,48,0.2)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 28,
            fontWeight: 500,
            color: "#f4f4f4",
            lineHeight: 1.35,
            letterSpacing: -0.2,
          }}
        >
          {tooltip}
        </div>
        {/* small triangle pointer */}
        <div
          style={{
            position: "absolute",
            ...(side === "bottom"
              ? {
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
              : side === "top"
              ? {
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
              : side === "right"
              ? {
                  left: -10,
                  top: "50%",
                  transform: "translateY(-50%) rotate(45deg)",
                }
              : {
                  right: -10,
                  top: "50%",
                  transform: "translateY(-50%) rotate(45deg)",
                }),
            width: 18,
            height: 18,
            background: "rgba(20,20,20,0.96)",
            borderTop: "1px solid rgba(191,155,48,0.5)",
            borderLeft: "1px solid rgba(191,155,48,0.5)",
          }}
        />
      </div>
    </>
  );
};
