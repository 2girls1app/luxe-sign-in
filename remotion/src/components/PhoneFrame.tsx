import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  width?: number;
}

/**
 * Stylized phone frame for in-video UI mockups.
 * Native aspect 390 x 844 (iPhone-ish). Default width 720 → height ~1559.
 */
export const PhoneFrame = ({ children, width = 720 }: PhoneFrameProps) => {
  const height = Math.round(width * (844 / 390));
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        borderRadius: 56,
        padding: 14,
        background: "linear-gradient(160deg, #1a1a1a, #0a0a0a)",
        boxShadow:
          "0 60px 120px -30px rgba(0,0,0,0.85), 0 0 80px -20px rgba(191,155,48,0.25), inset 0 0 0 1px rgba(191,155,48,0.18)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          overflow: "hidden",
          background: "#0b0b0b",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 130,
            height: 30,
            borderRadius: 999,
            background: "#000",
            zIndex: 50,
          }}
        />
        {children}
      </div>
    </div>
  );
};
