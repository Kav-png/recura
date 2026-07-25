import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const TOLERANCE_SECS = 30 * 60;

/**
 * ElevenLabs signs webhooks as `ElevenLabs-Signature: t=<unix>,v0=<hex hmac>`, where the hmac is
 * over `${t}.${rawBody}` (docs: https://elevenlabs.io/docs/eleven-api/resources/webhooks). Must
 * verify against the raw request body text, not a re-serialized JSON.parse of it.
 */
export function verifyElevenLabsSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [key, ...rest] = p.split("=");
      return [key, rest.join("=")];
    })
  );
  const timestamp = parts["t"];
  const candidates = signatureHeader
    .split(",")
    .filter((p) => p.startsWith("v0="))
    .map((p) => p.slice(3));
  if (!timestamp || candidates.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);

  return candidates.some((sig) => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
