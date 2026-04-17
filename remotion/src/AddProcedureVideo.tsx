import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./components/PersistentBackground";
import { AP_Scene1Intro } from "./scenes/addProcedure/AP_Scene1Intro";
import { AP_Scene2Procedures } from "./scenes/addProcedure/AP_Scene2Procedures";
import { AP_Scene3TapAdd } from "./scenes/addProcedure/AP_Scene3TapAdd";
import { AP_Scene4FillForm } from "./scenes/addProcedure/AP_Scene4FillForm";
import { AP_Scene5Save } from "./scenes/addProcedure/AP_Scene5Save";
import { AP_Scene6Success } from "./scenes/addProcedure/AP_Scene6Success";

const T = 18; // transition length in frames

export const AddProcedureVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        {/* Intro ~3s */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <AP_Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Procedures screen ~3.5s */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <AP_Scene2Procedures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Tap Add ~3.3s */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <AP_Scene3TapAdd />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Fill form ~5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <AP_Scene4FillForm />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Save ~3.3s */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <AP_Scene5Save />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Success ~4.3s */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <AP_Scene6Success />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
