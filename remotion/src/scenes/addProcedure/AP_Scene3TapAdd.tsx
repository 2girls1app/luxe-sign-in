import { AbsoluteFill } from "remotion";
import { PhoneScreen } from "../../components/PhoneScreen";
import { Caption } from "../../components/Caption";

const TOTAL = 100;

export const AP_Scene3TapAdd = () => {
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <Caption step="Step 2" title="Tap “Add New Procedure”" top={80} />
      <PhoneScreen
        src="images/03-add-dialog.png"
        totalFrames={TOTAL}
        zoom={[1.05, 1.12]}
        pan={[{ x: 0, y: 30 }, { x: 0, y: 50 }]}
        // The "Add New Procedure" row in the dialog (center-left)
        highlight={{ fromFrame: 20, x: 0.5, y: 0.51, size: 240 }}
      />
    </AbsoluteFill>
  );
};
