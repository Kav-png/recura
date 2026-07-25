import "server-only";

// Safety rail #1 (root CLAUDE.md): this notices a possible name overlap between a listed
// allergy and a discharge medication — it never concludes there IS an interaction (that's a
// clinical judgment), so matching stays literal (substring), not drug-class inference.
export type AllergyConflict = {
  medicationName: string;
  allergen: string;
  reaction: string | null;
};

const MIN_MATCH_LENGTH = 3;

function normalize(name: string): string {
  return name.toLowerCase().trim();
}

function namesOverlap(medicationName: string, allergen: string): boolean {
  const med = normalize(medicationName);
  const allergy = normalize(allergen);
  if (med.length < MIN_MATCH_LENGTH || allergy.length < MIN_MATCH_LENGTH) return false;
  return med.includes(allergy) || allergy.includes(med);
}

export function findAllergyMedicationConflicts(
  medications: { name: string }[],
  allergies: { allergen: string; reaction: string | null }[]
): AllergyConflict[] {
  const conflicts: AllergyConflict[] = [];
  for (const allergy of allergies) {
    for (const medication of medications) {
      if (namesOverlap(medication.name, allergy.allergen)) {
        conflicts.push({ medicationName: medication.name, allergen: allergy.allergen, reaction: allergy.reaction });
      }
    }
  }
  return conflicts;
}

export function buildAllergyConflictRedFlags(conflicts: AllergyConflict[]) {
  return conflicts.map((conflict) => ({
    severity: "danger" as const,
    title: `${conflict.medicationName} name matches a listed allergy`,
    explanation_plain_english: `The letter lists an allergy to ${conflict.allergen}${
      conflict.reaction ? ` (reaction: ${conflict.reaction})` : ""
    }, and ${conflict.medicationName} is on the discharge medication list. This may or may not be a real conflict — check with your pharmacist or GP.`,
  }));
}
