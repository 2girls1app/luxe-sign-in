import { FONT_BODY } from "../fonts";

interface ProgressDotsProps {
  current: number; // 1-indexed
  total: number;
  /** absolute position from top */
  top?: number;
}

export const ProgressDots = ({ current, total, top = 60 }: ProgressDotsProps) => {
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
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 6,
          color: "#BF9B30",
          textTransform: "uppercase",
        }}
      >
        Step {current} of {total}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i + 1 === current;
          const past = i + 1 < current;
          return (
            <div
              key={i}
              style={{
                width: active ? 36 : 10,
                height: 10,
                borderRadius: 999,
                background: active
                  ? "#BF9B30"
                  : past
                  ? "rgba(191,155,48,0.55)"
                  : "rgba(255,255,255,0.18)",
                transition: "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
