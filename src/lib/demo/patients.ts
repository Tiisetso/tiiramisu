/**
 * The clinic's caseload for the demo: Aino + five simulated patients, all generated and
 * scored by the same pipeline (persona.ts → signals.ts) so the numbers are consistent.
 */
import { DEMO_DAYS, generate, type DayData } from "@/lib/demo/persona";

export interface Patient {
  id: string;
  name: string;
  weeksSinceTms: number;
  days: DayData[];
  /** recent check-in snippets (what Claude summarises for the clinician) */
  quotes: string[];
  isAino?: boolean;
}

export const PATIENTS: Patient[] = [
  {
    id: "aino",
    name: "Aino Mäkelä",
    weeksSinceTms: 6,
    days: DEMO_DAYS,
    isAino: true,
    quotes: [
      "I stayed in bed most of yesterday, didn't really want to see anyone.",
      "Nothing ever seems to get easier.",
      "I did make tea this morning though.",
    ],
  },
  {
    id: "elias",
    name: "Elias Korhonen",
    weeksSinceTms: 9,
    days: generate({ seed: 7, driftStart: 50, driftStrength: 0.8, skipDays: [56, 58, 59] }),
    quotes: ["Work has been a lot. I'm not sleeping much.", "Skipped the gym again, can't be bothered."],
  },
  {
    id: "sara",
    name: "Sara Virtanen",
    weeksSinceTms: 4,
    days: generate({ seed: 21, driftStart: 53, driftStrength: 0.45 }),
    quotes: ["Bit flat this week, but I went to my sister's on Sunday.", "Evenings are harder than mornings."],
  },
  {
    id: "helmi",
    name: "Helmi Nieminen",
    weeksSinceTms: 12,
    days: generate({ seed: 33, driftStart: 99, driftStrength: 0, wobbleAt: 52, wobbleStrength: 0.6 }),
    quotes: ["Had a wobbly few days last week, feeling more like myself now.", "Back to swimming on Thursdays."],
  },
  {
    id: "mikko",
    name: "Mikko Laine",
    weeksSinceTms: 8,
    days: generate({ seed: 45, driftStart: 99, driftStrength: 0 }),
    quotes: ["Good week. Cooked with friends on Saturday.", "Sleeping well."],
  },
  {
    id: "jonas",
    name: "Jonas Berg",
    weeksSinceTms: 5,
    days: generate({ seed: 58, driftStart: 99, driftStrength: 0, skipDays: [54, 55, 56, 57, 58, 59] }),
    quotes: ["Busy with the kids, all fine.", "Nothing much to report."],
  },
];
