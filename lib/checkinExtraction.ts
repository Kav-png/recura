export type TranscriptLine = { speaker: "agent" | "patient"; text: string };

const PROM_QUESTIONS: Record<string, string> = {
  HF: "How much has shortness of breath limited your daily activities this week — none, a little, moderate, quite a bit, or extremely limited?",
  COPD: "How breathless have you been doing everyday activities — none, a little, moderate, quite a bit, or extremely breathless?",
  AMI: "How much has chest discomfort or fatigue limited your daily activities this week — none, a little, moderate, quite a bit, or extremely limited?",
  Pneumonia: "How breathless or fatigued have you been doing everyday activities since your pneumonia — none, a little, moderate, quite a bit, or extremely?",
};

export function promQuestionFor(condition: string) {
  return PROM_QUESTIONS[condition] ?? "How has your breathing or energy been today — none, a little, moderate, quite a bit, or extremely limited?";
}

export function pickPrimaryMedication(medications: { name: string; status: string }[]) {
  const byStatus = (status: string) => medications.find((m) => m.status === status);
  return byStatus("new")?.name ?? byStatus("changed")?.name ?? medications[0]?.name ?? "your medications";
}

export type CheckinExtraction = {
  summary: string;
  mood: "good" | "okay" | "tired" | "distressed";
  proms_score: number;
  flags_raised: string[];
  severity: "danger" | "warn" | "info" | null;
  alertMessage: string | null;
};

const SEVERE_KEYWORDS: { pattern: RegExp; flag: string; label: string }[] = [
  { pattern: /\bchest\b/i, flag: "chest_pain", label: "chest pain" },
  { pattern: /\bbleed(ing)?\b/i, flag: "bleeding", label: "bleeding" },
  { pattern: /\bnumb(ness)?\b/i, flag: "numbness", label: "numbness" },
  { pattern: /\bconfus(ed|ion)\b/i, flag: "confusion", label: "confusion" },
  {
    pattern: /\b(can'?t breathe|cannot breathe|struggling to breathe|gasping for (air|breath)|(severe(ly)?|extreme(ly)?|very) (breathless|short of breath)|breathless (even )?(sitting|resting|at rest))\b/i,
    flag: "severe_breathlessness",
    label: "severe breathlessness",
  },
  { pattern: /\b(lips?( are| feel| feels| turning)? blue|cyanosis|turning blue)\b/i, flag: "cyanosis", label: "possible cyanosis" },
  { pattern: /\bface (is |feels )?droop/i, flag: "facial_drooping", label: "facial drooping" },
  { pattern: /\bslurr(ed|ing)\b/i, flag: "slurred_speech", label: "slurred speech" },
];

const MILD_KEYWORDS: { pattern: RegExp; flag: string; label: string }[] = [
  { pattern: /\bdizzy|dizziness\b/i, flag: "dizziness", label: "dizziness" },
  { pattern: /\bweak(ness)?\b/i, flag: "weakness", label: "weakness" },
  { pattern: /\bswell(ing|en)?\b/i, flag: "swelling", label: "swelling" },
  { pattern: /\btired|fatigue|exhaust/i, flag: "fatigue", label: "fatigue" },
  { pattern: /\bbreathless|short(ness)? of breath\b/i, flag: "breathlessness", label: "breathlessness" },
];

const NEGATIVE_ANSWER = /\b(no|nope|didn'?t|did not|not yet|haven'?t|have not|forgot|missed)\b/i;

const ANTICOAGULANTS = ["warfarin", "coumadin", "apixaban", "eliquis", "rivaroxaban", "xarelto", "dabigatran", "pradaxa", "edoxaban", "heparin"];

const PROM_SCALE: { pattern: RegExp; raw: number }[] = [
  { pattern: /\b(extremely|totally|completely|a great deal)\b/i, raw: 4 },
  { pattern: /\b(quite a bit|a lot|significant(ly)?)\b/i, raw: 3 },
  { pattern: /\b(moderate(ly)?|some(what)?)\b/i, raw: 2 },
  { pattern: /\b(a little|mild(ly)?|slight(ly)?)\b/i, raw: 1 },
  { pattern: /\b(none|not at all|no issue|fine|good|normal|okay|steady)\b/i, raw: 0 },
];

function patientLines(transcript: TranscriptLine[]) {
  return transcript.filter((l) => l.speaker === "patient").map((l) => l.text);
}

function findMedicationAnswer(transcript: TranscriptLine[]): string | null {
  const idx = transcript.findIndex((l) => l.speaker === "agent" && /did you take/i.test(l.text));
  if (idx === -1) return null;
  const next = transcript.slice(idx + 1).find((l) => l.speaker === "patient");
  return next?.text ?? null;
}

function scorePromAnswer(text: string | undefined): number {
  if (!text) return 1;
  for (const { pattern, raw } of PROM_SCALE) {
    if (pattern.test(text)) return raw;
  }
  return 1;
}

export function extractCheckin(input: {
  condition: string;
  medicationName: string;
  transcript: TranscriptLine[];
}): CheckinExtraction {
  const { medicationName, transcript } = input;
  const allPatientText = patientLines(transcript).join(" ");

  const severeFlags = SEVERE_KEYWORDS.filter((k) => k.pattern.test(allPatientText));
  const mildFlags = MILD_KEYWORDS.filter((k) => k.pattern.test(allPatientText));

  const medAnswer = findMedicationAnswer(transcript);
  const missedMedication = medAnswer != null && NEGATIVE_ANSWER.test(medAnswer);
  const isAnticoagulant = ANTICOAGULANTS.some((name) => medicationName.toLowerCase().includes(name));

  const isDanger = severeFlags.length > 0;
  const lastPatientLine = patientLines(transcript).at(-1);
  const promRaw = isDanger ? 4 : scorePromAnswer(lastPatientLine);
  const proms_score = Math.round((4 - promRaw) * 25);

  const flags_raised = [
    ...severeFlags.map((f) => f.flag),
    ...mildFlags.map((f) => f.flag),
    ...(missedMedication ? ["missed_medication"] : []),
  ];

  let severity: CheckinExtraction["severity"] = null;
  let alertMessage: string | null = null;

  if (isDanger) {
    severity = "danger";
    const labels = severeFlags.map((f) => f.label).join(" and ");
    alertMessage = `${labels[0].toUpperCase()}${labels.slice(1)} reported — 999 advised, immediate review required.`;
  } else if (missedMedication && isAnticoagulant) {
    severity = "warn";
    alertMessage = `Missed ${medicationName} this morning.`;
  } else if (promRaw >= 3 || mildFlags.length >= 2) {
    severity = "warn";
    const labels = mildFlags.map((f) => f.label).join(", ");
    alertMessage = labels ? `High symptom burden reported: ${labels}.` : "High symptom burden reported during check-in.";
  } else if (mildFlags.length === 1 || missedMedication) {
    severity = "info";
    alertMessage = missedMedication
      ? `Missed ${medicationName} this morning.`
      : `${mildFlags[0].label[0].toUpperCase()}${mildFlags[0].label.slice(1)} reported during check-in.`;
  }

  const mood: CheckinExtraction["mood"] = isDanger
    ? "distressed"
    : promRaw >= 3 || mildFlags.length >= 2
      ? "tired"
      : promRaw >= 1 || mildFlags.length >= 1
        ? "okay"
        : "good";

  const flagLabels = [...severeFlags, ...mildFlags].map((f) => f.label);
  const summary = isDanger
    ? `Reports ${flagLabels.join(", ")}. Escalated immediately per protocol.`
    : flagLabels.length > 0
      ? `Reports ${flagLabels.join(", ")}${missedMedication ? `; missed ${medicationName} this morning` : ""}.`
      : missedMedication
        ? `Missed ${medicationName} this morning; no other symptoms reported.`
        : "No new symptoms reported.";

  return { summary, mood, proms_score, flags_raised, severity, alertMessage };
}
