import { AbsoluteFill } from "remotion";
import { PhoneScreen } from "../../components/PhoneScreen";
import { Caption } from "../../components/Caption";

const TOTAL = 100;

export const AP_Scene5Save = () => {
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <Caption step="Step 4" title="Save and you’re done" top={80} />
      <PhoneScreen
        src="images/05-form-filled.png"
        totalFrames={TOTAL}
        zoom={[1.1, 1.18]}
        pan={[{ x: 0, y: 80 }, { x: 0, y: 110 }]}
        // Save Procedure button (gold, near middle-bottom of dialog)
        highlight={{ fromFrame: 18, x: 0.5, y: 0.665, size: 240 }}
      />
    </AbsoluteFill>
  );
};
