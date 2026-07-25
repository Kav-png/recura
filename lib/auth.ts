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
