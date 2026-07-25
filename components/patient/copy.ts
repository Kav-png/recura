export const CONDITION_LABELS: Record<string, string> = {
  HF: "heart failure",
  COPD: "COPD",
  AMI: "a heart attack",
  Pneumonia: "pneumonia",
};

export const MOOD_META: Record<string, { label: string; emoji: string }> = {
  good: { label: "Feeling good", emoji: "🙂" },
  okay: { label: "Feeling okay", emoji: "😐" },
  tired: { label: "Feeling tired", emoji: "😴" },
  distressed: { label: "Had a rough day", emoji: "💛" },
};

export const SELF_CHECKIN_MOODS: { value: "good" | "okay" | "tired" | "distressed"; label: string; emoji: string }[] = [
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "distressed", label: "Not great", emoji: "😟" },
];
