import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { PhoneScreen } from "../../components/PhoneScreen";
import { Caption } from "../../components/Caption";

const TOTAL = 150;

export const AP_Scene4FillForm = () => {
  const frame = useCurrentFrame();
  // crossfade from empty -> filled around frame 75
  const filledOp = interpolate(frame, [70, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <Caption step="Step 3" title="Enter the procedure details" top={80} />
      <div style={{ position: "relative" }}>
        {/* Empty form */}
        <div style={{ opacity: 1 - filledOp }}>
          <PhoneScreen
            src="images/04-form-empty.png"
            totalFrames={TOTAL}
            zoom={[1.05, 1.12]}
            pan={[{ x: 0, y: 40 }, { x: 0, y: 30 }]}
            highlight={{ fromFrame: 25, x: 0.5, y: 0.44, size: 200 }}
          />
        </div>
        {/* Filled form crossfaded on top */}
        <div style={{ position: "absolute", inset: 0, opacity: filledOp }}>
          <PhoneScreen
            src="images/05-form-filled.png"
            totalFrames={TOTAL}
            zoom={[1.05, 1.12]}
            pan={[{ x: 0, y: 30 }, { x: 0, y: 20 }]}
            entranceFrames={1}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
