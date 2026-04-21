import { ReactNode } from "react";
import {
  ClinicalDashboardScreen,
  DoctorWorkspaceScreen,
  PreferenceCardScreen,
  TaskListScreen,
} from "./components/MockApp";

export type RoleId =
  | "nurse"
  | "first-assist"
  | "scrub-tech"
  | "anesthesia"
  | "physician-assistant";

export interface DemoStep {
  /** screen JSX rendered in the phone frame */
  screen: ReactNode;
  /** caption / tooltip text */
  tooltip: string;
  /** spotlight center on the FULL frame (1080×1920), normalized 0-1 */
  x: number;
  y: number;
  /** spotlight radius in px (frame px, not phone px) */
  radius: number;
  /** tooltip placement */
  side?: "top" | "bottom" | "left" | "right";
  /** scene length in frames (default 130) */
  duration?: number;
}

export interface RoleScript {
  id: RoleId;
  label: string;
  tagline: string;
  steps: DemoStep[];
}

/* ─── Frame/phone geometry ───
   Composition: 1080 × 1920
   Phone width 720, centered → x ∈ [180, 900], xCenter = 0.5
   Phone height ≈ 1559, vertically centered → top ≈ 181, bottom ≈ 1740
   Inner content (after status bar + header) starts ≈ y=265, bottom ≈ 1726
*/
const PHONE_TOP = 181;
const PHONE_INNER_TOP = 265; // after status bar
const PHONE_INNER_BOT = 1726;
const PHONE_LEFT = 180;
const PHONE_RIGHT = 900;
const FRAME_H = 1920;
const FRAME_W = 1080;

/** Convert screen-relative y (0=inner top, 1=inner bottom) to frame-normalized y */
const sy = (s: number): number => (PHONE_INNER_TOP + s * (PHONE_INNER_BOT - PHONE_INNER_TOP)) / FRAME_H;
/** Convert screen-relative x (0=phone left, 1=phone right) to frame-normalized x */
const sx = (s: number): number => (PHONE_LEFT + s * (PHONE_RIGHT - PHONE_LEFT)) / FRAME_W;

const NURSE: RoleScript = {
  id: "nurse",
  label: "Nurse",
  tagline: "Your day-to-day in the OR",
  steps: [
    // Step 1 — dashboard, highlight first case row
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "Your dashboard shows every case you're assigned to today, in time order.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    // Step 2 — same screen, emphasize tap action
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "Tap a case to open the surgeon's full preference card before you set up the room.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    // Step 3 — pref card grid, highlight Supplies tile (col 2 of 3, row 2 of 3)
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="supplies"
        />
      ),
      tooltip: "Open Supplies to see exactly what to pull from the core for this surgeon's case.",
      x: sx(0.5),
      y: sy(0.42),
      radius: 130,
      side: "bottom",
    },
    // Step 4 — supplies expanded list, highlight one item
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="supplies"
          itemSpotlight={3}
        />
      ),
      tooltip: "Every supply is listed with size and quantity — no more guessing what the surgeon prefers.",
      x: sx(0.5),
      y: sy(0.5),
      radius: 320,
      side: "bottom",
    },
    // Step 5 — back to grid, highlight Medication tile
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="medications"
        />
      ),
      tooltip: "Check Medications for any drugs you need on the back table or ready to hand to anesthesia.",
      x: sx(0.18),
      y: sy(0.42),
      radius: 130,
      side: "right",
    },
    // Step 6 — Positioning tile (top row, col 2)
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="positioning"
        />
      ),
      tooltip: "Positioning shows how the patient should be set up before prep and drape.",
      x: sx(0.5),
      y: sy(0.32),
      radius: 130,
      side: "bottom",
    },
    // Step 7 — back to dashboard, Favorites tile bottom-left
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="favorites"
        />
      ),
      tooltip: "Favorite the surgeons you work with most — they appear on top of your dashboard.",
      x: sx(0.27),
      y: sy(0.62),
      radius: 130,
      side: "top",
    },
  ],
};

const FIRST_ASSIST: RoleScript = {
  id: "first-assist",
  label: "First Assistant",
  tagline: "Surgeon preferences at your fingertips",
  steps: [
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="First Assistant"
          userName="Marcus Chen"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "See every case you're scrubbing in on, sorted by start time.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    {
      screen: <DoctorWorkspaceScreen doctorName="Dr. Bagga" spotlightId="proc-1" />,
      tooltip: "Browse a surgeon's procedure library to study their preferences ahead of time.",
      x: sx(0.27),
      y: sy(0.42),
      radius: 145,
      side: "right",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="positioning"
        />
      ),
      tooltip: "Positioning notes — exactly how the surgeon wants the patient placed and tilted.",
      x: sx(0.5),
      y: sy(0.32),
      radius: 130,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="positioning"
          itemSpotlight={1}
        />
      ),
      tooltip: "Each positioning detail is captured — table tilt, arm placement, padding.",
      x: sx(0.5),
      y: sy(0.42),
      radius: 320,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="steps"
        />
      ),
      tooltip: "Procedure Steps walk you through the case in order so you can anticipate every move.",
      x: sx(0.82),
      y: sy(0.55),
      radius: 130,
      side: "left",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="instruments"
        />
      ),
      tooltip: "Instruments shows the surgeon's go-to retractors, dissectors, and energy devices.",
      x: sx(0.18),
      y: sy(0.55),
      radius: 130,
      side: "right",
    },
  ],
};

const SCRUB_TECH: RoleScript = {
  id: "scrub-tech",
  label: "Scrub Tech",
  tagline: "Setup and instruments — perfectly prepped",
  steps: [
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Scrub Tech"
          userName="Jordan Pierce"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "Pull up your assigned cases and tap into the one you're setting up next.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="instruments"
        />
      ),
      tooltip: "Open Instruments to see the surgeon's preferred pan and back-table layout.",
      x: sx(0.18),
      y: sy(0.55),
      radius: 130,
      side: "right",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="instruments"
          itemSpotlight={4}
        />
      ),
      tooltip: "Every instrument is named so you can pull, count, and lay out the field with confidence.",
      x: sx(0.5),
      y: sy(0.5),
      radius: 320,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="supplies"
        />
      ),
      tooltip: "Supplies lists trocars, clips, and disposables — everything you'll open onto the field.",
      x: sx(0.5),
      y: sy(0.42),
      radius: 130,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="instruments"
          itemSpotlight={5}
        />
      ),
      tooltip: "Setup notes tell you where to position the Mayo stand and how the surgeon likes the field.",
      x: sx(0.5),
      y: sy(0.58),
      radius: 320,
      side: "top",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="sutures"
        />
      ),
      tooltip: "Sutures shows exactly which suture types and sizes to load — no surprises at closing.",
      x: sx(0.82),
      y: sy(0.42),
      radius: 130,
      side: "left",
    },
  ],
};

const ANESTHESIA: RoleScript = {
  id: "anesthesia",
  label: "Anesthesia",
  tagline: "Surgeon-specific anesthesia preferences",
  steps: [
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Anesthesia"
          userName="Dr. Priya Shah"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "All your assigned cases for the day, with surgeon and OR room.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="anesthesia"
        />
      ),
      tooltip: "The Anesthesia widget is the first thing you see — every surgeon's preferences in one place.",
      x: sx(0.18),
      y: sy(0.32),
      radius: 130,
      side: "right",
    },
    // Anesthesia expanded list — 5 items, ~y 0.27..0.55 inside screen
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="anesthesia"
          itemSpotlight={0}
        />
      ),
      tooltip: "Anesthesia type — general endotracheal for this surgeon's lap chole cases.",
      x: sx(0.5),
      y: sy(0.3),
      radius: 280,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="anesthesia"
          itemSpotlight={1}
        />
      ),
      tooltip: "Induction and maintenance agents — exactly what the surgeon expects.",
      x: sx(0.5),
      y: sy(0.36),
      radius: 280,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="anesthesia"
          itemSpotlight={3}
        />
      ),
      tooltip: "Antibiotic timing and dose — tied to incision so you never miss the window.",
      x: sx(0.5),
      y: sy(0.48),
      radius: 280,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="anesthesia"
          itemSpotlight={4}
        />
      ),
      tooltip: "Reversal preferences captured for end-of-case — no last-minute texts.",
      x: sx(0.5),
      y: sy(0.55),
      radius: 280,
      side: "top",
    },
  ],
};

const PA: RoleScript = {
  id: "physician-assistant",
  label: "Physician Assistant",
  tagline: "Pre-op, the case, and post-op tasks",
  steps: [
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Physician Assistant"
          userName="Alex Morgan"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip: "Today's assigned cases, sorted by time — your daily roadmap.",
      x: sx(0.5),
      y: sy(0.18),
      radius: 200,
      side: "bottom",
    },
    {
      screen: (
        <TaskListScreen
          title="Pre-Op Tasks"
          tasks={[
            { label: "Confirm consent signed", done: true },
            { label: "Verify NPO status" },
            { label: "Mark surgical site" },
            { label: "Pre-op antibiotic ordered" },
            { label: "Review labs & imaging" },
          ]}
          spotlightIndex={2}
        />
      ),
      tooltip: "Pre-op tasks for every case — checked off as you go through the workup.",
      x: sx(0.5),
      y: sy(0.4),
      radius: 320,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="steps"
        />
      ),
      tooltip: "Open the preference card to review the full procedure overview before scrubbing in.",
      x: sx(0.82),
      y: sy(0.55),
      radius: 130,
      side: "left",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="positioning"
        />
      ),
      tooltip: "Positioning, prep, and key procedure steps — everything you need to assist confidently.",
      x: sx(0.5),
      y: sy(0.32),
      radius: 130,
      side: "bottom",
    },
    {
      screen: (
        <TaskListScreen
          title="Post-Op Tasks"
          tasks={[
            { label: "Dictate operative note" },
            { label: "Place post-op orders" },
            { label: "Update family" },
            { label: "PACU handoff complete" },
            { label: "Schedule follow-up visit" },
          ]}
          spotlightIndex={0}
        />
      ),
      tooltip: "Post-op tasks keep dictation, orders, and follow-ups from slipping through the cracks.",
      x: sx(0.5),
      y: sy(0.27),
      radius: 280,
      side: "bottom",
    },
    {
      screen: (
        <TaskListScreen
          title="Post-Op Tasks"
          tasks={[
            { label: "Dictate operative note", done: true },
            { label: "Place post-op orders", done: true },
            { label: "Update family", done: true },
            { label: "PACU handoff complete", done: true },
            { label: "Schedule follow-up visit", done: true },
          ]}
        />
      ),
      tooltip: "Mark each task complete and move to your next case — nothing forgotten.",
      x: sx(0.5),
      y: sy(0.4),
      radius: 320,
      side: "bottom",
    },
  ],
};

export const ROLE_SCRIPTS: Record<RoleId, RoleScript> = {
  nurse: NURSE,
  "first-assist": FIRST_ASSIST,
  "scrub-tech": SCRUB_TECH,
  anesthesia: ANESTHESIA,
  "physician-assistant": PA,
};
