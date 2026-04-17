import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./components/PersistentBackground";
import { AI_Scene1Hook } from "./scenes/aiCard/AI_Scene1Hook";
import { AI_Scene2TwoPaths } from "./scenes/aiCard/AI_Scene2TwoPaths";
import { AI_Scene3Upload } from "./scenes/aiCard/AI_Scene3Upload";
import { AI_Scene4Extract } from "./scenes/aiCard/AI_Scene4Extract";
import { AI_Scene5Prefill } from "./scenes/aiCard/AI_Scene5Prefill";
import { AI_Scene6Builds } from "./scenes/aiCard/AI_Scene6Builds";
import { AI_Scene7Outro } from "./scenes/aiCard/AI_Scene7Outro";

const T = 18; // transition length in frames

export const AICardVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        {/* Hook ~3s */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <AI_Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Two paths ~3.7s */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <AI_Scene2TwoPaths />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Path A — Upload ~4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AI_Scene3Upload />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Extract ~3.7s */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <AI_Scene4Extract />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Path B — Prefill ~4.3s */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <AI_Scene5Prefill />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Card builds ~4.7s */}
        <TransitionSeries.Sequence durationInFrames={140}>
          <AI_Scene6Builds />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />

        {/* Outro ~4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <AI_Scene7Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
