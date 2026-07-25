import "server-only";
import { randomInt } from "crypto";

// Excludes visually-ambiguous characters (0/O, 1/I/L) since this is meant to be read off a
// discharge summary or read aloud, not copy-pasted.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePatientAccessCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}
