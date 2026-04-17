import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { AddProcedureVideo } from "./AddProcedureVideo";
import { AICardVideo } from "./AICardVideo";

// AddProcedureVideo timing:
// scenes: 100 + 110 + 100 + 150 + 100 + 130 = 690 frames
// transitions overlap: 5 × 18 = 90 → 600 frames at 30fps = 20s
const ADD_PROC_DURATION = 600;

// AICardVideo timing:
// scenes: 100+110+120+110+130+140+120 = 830 frames
// transitions overlap: 6 × 18 = 108 → 722 frames at 30fps ≈ 24s
const AI_CARD_DURATION = 722;

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="add-procedure"
      component={AddProcedureVideo}
      durationInFrames={ADD_PROC_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ai-card"
      component={AICardVideo}
      durationInFrames={AI_CARD_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
