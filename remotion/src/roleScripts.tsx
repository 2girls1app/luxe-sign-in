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
  /** scene length in frames (default 110) */
  duration?: number;
}

export interface RoleScript {
  id: RoleId;
  label: string;
  tagline: string;
  steps: DemoStep[];
}

/* Frame layout reference:
   - Composition is 1080 × 1920
   - Phone frame width 720, centered horizontally → phone left edge ≈ x=180, right ≈ x=900
   - Phone is vertically centered with caption above; body content roughly y 280–1620
*/

const NURSE: RoleScript = {
  id: "nurse",
  label: "Nurse",
  tagline: "Your day-to-day in the OR",
  steps: [
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip:
        "Your dashboard shows every case you're assigned to today, in time order.",
      x: 0.5,
      y: 0.42,
      radius: 240,
      side: "bottom",
    },
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="case-1"
        />
      ),
      tooltip:
        "Tap a case to open the surgeon's full preference card before you set up the room.",
      x: 0.5,
      y: 0.42,
      radius: 240,
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
      tooltip:
        "Open Supplies to see exactly what to pull from the core for this surgeon's case.",
      x: 0.72,
      y: 0.55,
      radius: 145,
      side: "left",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="supplies"
          itemSpotlight={3}
        />
      ),
      tooltip:
        "Every supply is listed with size and quantity — no more guessing what the surgeon prefers.",
      x: 0.5,
      y: 0.6,
      radius: 280,
      side: "top",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="medications"
        />
      ),
      tooltip:
        "Check Medications for any drugs you need on the back table or ready to hand to anesthesia.",
      x: 0.5,
      y: 0.55,
      radius: 145,
      side: "bottom",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="positioning"
        />
      ),
      tooltip:
        "Positioning shows how the patient should be set up before prep and drape.",
      x: 0.28,
      y: 0.5,
      radius: 145,
      side: "right",
    },
    {
      screen: (
        <ClinicalDashboardScreen
          roleLabel="Nurse"
          userName="Sarah Lopez"
          facility="Mercy General Hospital"
          spotlightId="favorites"
        />
      ),
      tooltip:
        "Favorite the surgeons you work with most — they appear on top of your dashboard.",
      x: 0.32,
      y: 0.78,
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
      tooltip:
        "See every case you're scrubbing in on, sorted by start time.",
      x: 0.5,
      y: 0.42,
      radius: 240,
      side: "bottom",
    },
    {
      screen: (
        <DoctorWorkspaceScreen doctorName="Dr. Bagga" spotlightId="proc-1" />
      ),
      tooltip:
        "Browse a surgeon's procedure library to study their preferences ahead of time.",
      x: 0.34,
      y: 0.55,
      radius: 150,
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
      tooltip:
        "Positioning notes — exactly how the surgeon wants the patient placed and tilted.",
      x: 0.28,
      y: 0.5,
      radius: 150,
      side: "right",
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
      tooltip:
        "Each positioning detail is captured — table tilt, arm placement, padding.",
      x: 0.5,
      y: 0.55,
      radius: 280,
      side: "top",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="steps"
        />
      ),
      tooltip:
        "Procedure Steps walk you through the case in order so you can anticipate every move.",
      x: 0.72,
      y: 0.78,
      radius: 145,
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
      tooltip:
        "Instruments shows the surgeon's go-to retractors, dissectors, and energy devices.",
      x: 0.28,
      y: 0.78,
      radius: 145,
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
      tooltip:
        "Pull up your assigned cases and tap into the one you're setting up next.",
      x: 0.5,
      y: 0.42,
      radius: 240,
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
      tooltip:
        "Open Instruments to see the surgeon's preferred pan and back-table layout.",
      x: 0.28,
      y: 0.78,
      radius: 145,
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
      tooltip:
        "Every instrument is named so you can pull, count, and lay out the field with confidence.",
      x: 0.5,
      y: 0.6,
      radius: 280,
      side: "top",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="supplies"
        />
      ),
      tooltip:
        "Supplies lists trocars, clips, and disposables — everything you'll open onto the field.",
      x: 0.72,
      y: 0.55,
      radius: 145,
      side: "left",
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
      tooltip:
        "Setup notes tell you where to position the Mayo stand and how the surgeon likes the field.",
      x: 0.5,
      y: 0.62,
      radius: 280,
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
      tooltip:
        "Sutures shows exactly which suture types and sizes to load — no surprises at closing.",
      x: 0.72,
      y: 0.78,
      radius: 145,
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
      tooltip:
        "All your assigned cases for the day, with surgeon and OR room.",
      x: 0.5,
      y: 0.42,
      radius: 240,
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
      tooltip:
        "The Anesthesia widget is the first thing you see — every surgeon's preferences in one place.",
      x: 0.28,
      y: 0.55,
      radius: 145,
      side: "right",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          expanded="anesthesia"
          itemSpotlight={0}
        />
      ),
      tooltip:
        "Anesthesia type — general endotracheal for this surgeon's lap chole cases.",
      x: 0.5,
      y: 0.5,
      radius: 280,
      side: "top",
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
      tooltip:
        "Induction and maintenance agents — exactly what the surgeon expects.",
      x: 0.5,
      y: 0.58,
      radius: 280,
      side: "top",
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
      tooltip:
        "Antibiotic timing and dose — tied to incision so you never miss the window.",
      x: 0.5,
      y: 0.7,
      radius: 280,
      side: "top",
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
      tooltip:
        "Reversal preferences captured for end-of-case — no last-minute texts.",
      x: 0.5,
      y: 0.78,
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
      tooltip:
        "Today's assigned cases, sorted by time — your daily roadmap.",
      x: 0.5,
      y: 0.42,
      radius: 240,
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
      tooltip:
        "Pre-op tasks for every case — checked off as you go through the workup.",
      x: 0.5,
      y: 0.55,
      radius: 280,
      side: "top",
    },
    {
      screen: (
        <PreferenceCardScreen
          procedure="Lap Cholecystectomy"
          doctor="Dr. Bagga"
          spotlightId="steps"
        />
      ),
      tooltip:
        "Open the preference card to review the full procedure overview before scrubbing in.",
      x: 0.72,
      y: 0.78,
      radius: 145,
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
      tooltip:
        "Positioning, prep, and key procedure steps — everything you need to assist confidently.",
      x: 0.28,
      y: 0.5,
      radius: 145,
      side: "right",
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
      tooltip:
        "Post-op tasks keep dictation, orders, and follow-ups from slipping through the cracks.",
      x: 0.5,
      y: 0.5,
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
      tooltip:
        "Mark each task complete and move to your next case — nothing forgotten.",
      x: 0.5,
      y: 0.55,
      radius: 280,
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
