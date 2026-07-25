import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "dsn_session";

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(value).digest("hex");
}

export function sessionTokenForCode(code: string) {
  return sign(code);
}

export function isValidAccessCode(code: string) {
  const expected = process.env.ACCESS_CODE!;
  const a = Buffer.from(code);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  const expected = sessionTokenForCode(process.env.ACCESS_CODE!);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// A single patient's own portal session — deliberately separate from the shared SESSION_COOKIE
// above (which opens the whole demo practice, picker included). The cookie carries the patientId
// in plain sight (it's a UUID, not a secret — the signature is what grants access) so the caller
// can recover which patient a session belongs to without a database lookup.
export const PATIENT_SESSION_COOKIE = "dsn_patient_session";

export function patientSessionCookieValue(patientId: string) {
  return `${patientId}.${sign(patientId)}`;
}

// Returns the patientId the cookie is valid for, or null if missing/tampered.
export function verifyPatientSessionCookie(value: string | undefined): string | null {
  if (!value) return null;
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const patientId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expected = sign(patientId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? patientId : null;
}
