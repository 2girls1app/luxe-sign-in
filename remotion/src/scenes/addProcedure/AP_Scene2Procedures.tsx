import { AbsoluteFill } from "remotion";
import { PhoneScreen } from "../../components/PhoneScreen";
import { Caption } from "../../components/Caption";

const TOTAL = 110;

export const AP_Scene2Procedures = () => {
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <Caption step="Step 1" title="Open your Procedures" top={80} />
      <PhoneScreen
        src="images/02-procedures-list.png"
        totalFrames={TOTAL}
        zoom={[1.0, 1.05]}
        pan={[{ x: 0, y: 0 }, { x: 0, y: -20 }]}
        // Highlight the gold "+ Add Procedure" pill near top-right
        highlight={{ fromFrame: 35, x: 0.78, y: 0.27, size: 200 }}
      />
    </AbsoluteFill>
  );
};
