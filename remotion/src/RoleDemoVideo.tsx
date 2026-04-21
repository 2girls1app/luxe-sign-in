import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { PersistentBackground } from "./components/PersistentBackground";
import { PhoneFrame } from "./components/PhoneFrame";
import { SpotlightOverlay } from "./components/SpotlightOverlay";
import { ProgressDots } from "./components/ProgressDots";
import { FONT_BODY, FONT_DISPLAY } from "./fonts";
import { RoleScript, ROLE_SCRIPTS, RoleId } from "./roleScripts";

const STEP_DURATION = 130; // ~4.3s per step
const INTRO_DURATION = 90;
const OUTRO_DURATION = 110;
const T = 16; // transition length

interface Props {
  roleId: RoleId;
}

export const RoleDemoVideo = ({ roleId }: Props) => {
  const role = ROLE_SCRIPTS[roleId];
  const totalSteps = role.steps.length;

  // TransitionSeries requires direct Sequence/Transition children — we cannot wrap them in a component.
  const children: React.ReactNode[] = [];

  children.push(
    <TransitionSeries.Sequence key="intro" durationInFrames={INTRO_DURATION}>
      <IntroScene role={role} />
    </TransitionSeries.Sequence>
  );
  children.push(
    <TransitionSeries.Transition
      key="t-intro"
      presentation={fade()}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
    />
  );

  role.steps.forEach((step, i) => {
    const duration = step.duration ?? STEP_DURATION;
    children.push(
      <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={duration}>
        <StepScene
          step={step}
          stepIndex={i}
          totalSteps={totalSteps}
          duration={duration}
        />
      </TransitionSeries.Sequence>
    );
    children.push(
      <TransitionSeries.Transition
        key={`t-${i}`}
        presentation={fade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
      />
    );
  });

  children.push(
    <TransitionSeries.Sequence key="outro" durationInFrames={OUTRO_DURATION}>
      <OutroScene role={role} />
    </TransitionSeries.Sequence>
  );

  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};

const StepScene = ({
  step,
  stepIndex,
  totalSteps,
  duration,
}: {
  step: RoleScript["steps"][number];
  stepIndex: number;
  totalSteps: number;
  duration: number;
}) => {
  const frame = useCurrentFrame();

  // subtle phone breathing
  const breathe = Math.sin(frame * 0.04) * 6;
  const phoneOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: phoneOp,
          transform: `translateY(${breathe}px)`,
        }}
      >
        <PhoneFrame width={720}>{step.screen}</PhoneFrame>
      </div>

      {/* Spotlight + tooltip overlay (covers whole frame) */}
      <Sequence from={20}>
        <SpotlightOverlay
          x={step.x}
          y={step.y}
          radius={step.radius}
          tooltip={step.tooltip}
          side={step.side}
          totalFrames={duration - 20}
        />
      </Sequence>

      <ProgressDots current={stepIndex + 1} total={totalSteps} top={50} />
    </AbsoluteFill>
  );
};

const IntroScene = ({ role }: { role: RoleScript }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const badgeOp = interpolate(badgeSpring, [0, 1], [0, 1]);
  const badgeY = interpolate(badgeSpring, [0, 1], [40, 0]);

  const titleOp = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(
    spring({ frame: frame - 18, fps, config: { damping: 20 } }),
    [0, 1],
    [40, 0]
  );

  const lineW = interpolate(frame, [40, 70], [0, 480], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOp = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [55, 80], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: badgeOp,
          transform: `translateY(${badgeY}px)`,
          padding: "14px 36px",
          borderRadius: 999,
          border: "1px solid rgba(191,155,48,0.5)",
          background: "rgba(191,155,48,0.1)",
          marginBottom: 40,
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 24,
            color: "#BF9B30",
            letterSpacing: 8,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Demo · {role.label}
        </span>
      </div>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 96,
            fontWeight: 700,
            color: "#f4f4f4",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          A guided tour
          <br />
          for the <span style={{ color: "#BF9B30" }}>{role.label}</span>
        </span>
      </div>
      <div
        style={{
          width: lineW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #BF9B30, transparent)",
          marginTop: 50,
          marginBottom: 32,
        }}
      />
      <div style={{ opacity: taglineOp, transform: `translateY(${taglineY}px)` }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 32,
            color: "#f4f4f4",
            opacity: 0.85,
            letterSpacing: 2,
            fontWeight: 400,
            textAlign: "center",
            display: "block",
            maxWidth: 900,
          }}
        >
          {role.tagline}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const OutroScene = ({ role }: { role: RoleScript }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  const subOp = interpolate(frame, [22, 45], [0, 1], { extrapolateRight: "clamp" });

  const ctaSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.85, 1]);
  const ctaOp = interpolate(ctaSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 100,
            fontWeight: 700,
            color: "#f4f4f4",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          You're <span style={{ color: "#BF9B30" }}>ready.</span>
        </span>
      </div>
      <div
        style={{
          opacity: subOp,
          marginTop: 36,
          maxWidth: 800,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 30,
            color: "#f4f4f4",
            opacity: 0.8,
            lineHeight: 1.4,
            fontWeight: 400,
          }}
        >
          That's everything a {role.label} needs to know to use 1st Assist on day one.
        </span>
      </div>
      <div
        style={{
          marginTop: 60,
          opacity: ctaOp,
          transform: `scale(${ctaScale})`,
          padding: "22px 60px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #BF9B30, #8a6d1d)",
          boxShadow: "0 30px 80px rgba(191,155,48,0.4)",
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 32,
            fontWeight: 700,
            color: "#0b0b0b",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Get Started
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const totalDurationFor = (roleId: RoleId): number => {
  const role = ROLE_SCRIPTS[roleId];
  const stepsTotal = role.steps.reduce(
    (acc, s) => acc + (s.duration ?? STEP_DURATION),
    0
  );
  // INTRO + (steps) + OUTRO, minus T overlap per transition.
  // Number of transitions: 1 (intro→step1) + (steps-1 between steps) + 1 (lastStep→outro) = steps + 1
  const transitions = role.steps.length + 1;
  return INTRO_DURATION + stepsTotal + OUTRO_DURATION - transitions * T;
};
