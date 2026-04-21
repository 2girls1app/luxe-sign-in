import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { AddProcedureVideo } from "./AddProcedureVideo";
import { AICardVideo } from "./AICardVideo";
import { RoleDemoVideo, totalDurationFor } from "./RoleDemoVideo";
import { RoleId } from "./roleScripts";

const ADD_PROC_DURATION = 600;
const AI_CARD_DURATION = 722;

const ROLE_IDS: RoleId[] = [
  "nurse",
  "first-assist",
  "scrub-tech",
  "anesthesia",
  "physician-assistant",
];

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
    {ROLE_IDS.map((roleId) => (
      <Composition
        key={roleId}
        id={`demo-${roleId}`}
        component={RoleDemoVideo}
        durationInFrames={totalDurationFor(roleId)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ roleId }}
      />
    ))}
  </>
);
