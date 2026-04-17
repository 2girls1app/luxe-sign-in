import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";

interface PhoneScreenProps {
  src: string;
  /** subtle Ken-Burns scale start/end (e.g. [1, 1.05]) */
  zoom?: [number, number];
  /** subtle pan from -> to in px (e.g. [{x:0,y:0},{x:0,y:-30}]) */
  pan?: [{ x: number; y: number }, { x: number; y: number }];
  /** entrance: fade-in length in frames */
  entranceFrames?: number;
  /** total scene length so zoom/pan map across full duration */
  totalFrames: number;
  /** highlight ring on a region (normalized 0-1) */
  highlight?: {
    /** appears at this frame */
    fromFrame: number;
    /** normalized 0-1 coordinates within the screen image */
    x: number;
    y: number;
    /** ring diameter in screen-image px */
    size?: number;
  };
}

// Native screenshot aspect: 390 x 844 (iPhone-ish). We render at 720 wide.
const SCREEN_W = 720;
const SCREEN_H = Math.round(720 * (844 / 390)); // ~1559

export const PhoneScreen = ({
  src,
  zoom = [1, 1.04],
  pan = [{ x: 0, y: 0 }, { x: 0, y: 0 }],
  entranceFrames = 12,
  totalFrames,
  highlight,
}: PhoneScreenProps) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, entranceFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterY = interpolate(frame, [0, entranceFrames], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, totalFrames], zoom, {
    extrapolateRight: "clamp",
  });
  const px = interpolate(frame, [0, totalFrames], [pan[0].x, pan[1].x], {
    extrapolateRight: "clamp",
  });
  const py = interpolate(frame, [0, totalFrames], [pan[0].y, pan[1].y], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${enterY}px)`,
        width: SCREEN_W,
        height: SCREEN_H,
        position: "relative",
        borderRadius: 48,
        overflow: "hidden",
        border: "2px solid rgba(191,155,48,0.35)",
        boxShadow:
          "0 60px 120px -30px rgba(0,0,0,0.85), 0 0 80px -20px rgba(191,155,48,0.25)",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${px}px, ${py}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
          }}
        />
      </div>

      {highlight && (
        <TapIndicator
          fromFrame={highlight.fromFrame}
          x={highlight.x}
          y={highlight.y}
          size={highlight.size ?? 180}
          screenWidth={SCREEN_W}
          screenHeight={SCREEN_H}
        />
      )}
    </div>
  );
};

interface TapProps {
  fromFrame: number;
  x: number;
  y: number;
  size: number;
  screenWidth: number;
  screenHeight: number;
}

const TapIndicator = ({ fromFrame, x, y, size, screenWidth, screenHeight }: TapProps) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;

  // dot pulse (always visible after fromFrame)
  const dotOp = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotScale = interpolate(local, [0, 10], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ripples loop every 45 frames
  const ringPhase = ((local % 45) / 45);
  const ringScale = interpolate(ringPhase, [0, 1], [0.6, 1.6]);
  const ringOp = interpolate(ringPhase, [0, 0.85], [0.85, 0]);

  if (local < 0) return null;

  const left = x * screenWidth - size / 2;
  const top = y * screenHeight - size / 2;

  return (
    <>
      {/* expanding ripple */}
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: size,
          height: size,
          borderRadius: "50%",
          border: "3px solid #BF9B30",
          transform: `scale(${ringScale})`,
          opacity: ringOp * dotOp,
        }}
      />
      {/* solid tap dot */}
      <div
        style={{
          position: "absolute",
          left: x * screenWidth - size * 0.18,
          top: y * screenHeight - size * 0.18,
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: "50%",
          background: "rgba(191,155,48,0.85)",
          boxShadow: "0 0 40px rgba(191,155,48,0.8), 0 0 100px rgba(191,155,48,0.4)",
          transform: `scale(${dotScale})`,
          opacity: dotOp,
        }}
      />
    </>
  );
};
