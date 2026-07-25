import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export function isSupportedImageType(mimeType: string): mimeType is SupportedImageType {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

const REQUIRED_SUMMARY_SUFFIX = "check with your pharmacist or GP";

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().nullable(),
  frequency: z.string().nullable(),
  status: z.enum(["new", "changed", "stopped", "unchanged"]),
  reason: z.string().nullable(),
});

const redFlagSchema = z.object({
  severity: z.enum(["info", "warn", "danger"]),
  title: z.string().min(1),
  explanation_plain_english: z.string().min(1),
});

export const parsedLetterSchema = z.object({
  patient_name: z.string().min(1),
  condition: z.enum(["HF", "COPD", "AMI", "Pneumonia"]),
  discharge_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "discharge_date must be YYYY-MM-DD"),
  medications: z.array(medicationSchema),
  red_flags: z.array(redFlagSchema),
  plain_english_summary: z.string().min(1),
});

export type ParsedLetter = z.infer<typeof parsedLetterSchema>;

// Safety rail #1 (root CLAUDE.md): the system never diagnoses, prescribes, or reassures — it
// notices, explains in plain language, and escalates to humans. Safety rail #3: every plain-English
// explanation ends with "check with your pharmacist or GP".
const SYSTEM_PROMPT = `You extract structured data from a photographed hospital discharge summary for a post-discharge monitoring tool used by clinicians. Return ONLY raw JSON matching exactly this shape, no markdown fences, no commentary before or after:

{
  "patient_name": string,
  "condition": "HF" | "COPD" | "AMI" | "Pneumonia",
  "discharge_date": string in YYYY-MM-DD format,
  "medications": [{ "name": string, "dose": string|null, "frequency": string|null, "status": "new"|"changed"|"stopped"|"unchanged", "reason": string|null }],
  "red_flags": [{ "severity": "info"|"warn"|"danger", "title": string, "explanation_plain_english": string }],
  "plain_english_summary": string
}

Rules:
- "condition": pick the single closest match to HF (heart failure), COPD, AMI (heart attack), or Pneumonia based on the primary diagnosis in the letter. Always pick one of the four even if the match is imperfect.
- "medications": include every medication listed on discharge. Read the letter's own annotations (e.g. "NEW", "replaces X", "continue", struck through) to set "status" — default to "unchanged" only when the letter gives no signal either way.
- "red_flags": 1-3 items, each grounded ONLY in something explicitly stated in the letter (an explicit weight-gain or symptom threshold to watch for, a follow-up test that's still pending, a drug interaction or up-titration risk the letter itself calls out). Do not invent generic warnings that aren't tied to this specific letter's content.
- You never diagnose, prescribe, or reassure about symptoms. You notice and explain in plain language, nothing more.
- "plain_english_summary" must be 2-3 short sentences a layperson can understand. Do NOT add any pharmacist/GP disclaimer yourself — one is appended automatically after your response.
- Output raw JSON only — nothing else.`;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

// Never trust the model to reliably comply with an "always end with X" instruction — strip any
// occurrence it adds anyway (it sometimes echoes the phrase mid-sentence AND at the end) and
// append it deterministically instead, so safety rail #3 (root CLAUDE.md) always holds exactly once.
function enforceSummarySuffix(summary: string): string {
  const suffixPattern = new RegExp(`[\\s—–-]*${REQUIRED_SUMMARY_SUFFIX}\\.?`, "gi");
  const withoutSuffix = summary.trim().replace(suffixPattern, "").trim().replace(/[.\s]+$/, "");
  return `${withoutSuffix} — ${REQUIRED_SUMMARY_SUFFIX}.`;
}

async function callClaude(anthropic: Anthropic, imageBase64: string, mediaType: SupportedImageType, retryNote?: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: retryNote ?? "Extract the structured JSON described in the system prompt from this discharge letter photo.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

/**
 * Photo of a discharge letter -> validated structured JSON. Retries once with the validation
 * error fed back to the model if the first response doesn't parse (Block A spec).
 */
export async function parseLetterImage(imageBase64: string, mediaType: string): Promise<ParsedLetter> {
  if (!isSupportedImageType(mediaType)) {
    throw new Error(`Unsupported image type "${mediaType}" — use JPEG, PNG, GIF, or WEBP.`);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured — letter parsing is unavailable until it's set.");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const raw = await callClaude(anthropic, imageBase64, mediaType);
  const firstAttempt = parsedLetterSchema.safeParse(safeJsonParse(stripCodeFence(raw)));
  const result = firstAttempt.success
    ? firstAttempt
    : parsedLetterSchema.safeParse(
        safeJsonParse(
          stripCodeFence(
            await callClaude(
              anthropic,
              imageBase64,
              mediaType,
              `Your previous response was not valid JSON matching the required schema (${firstAttempt.error.message}). Return ONLY valid JSON matching the schema exactly, nothing else.`
            )
          )
        )
      );

  if (!result.success) {
    throw new Error("Couldn't read this letter clearly. Try a clearer, well-lit photo, or enter the patient's details manually.");
  }

  return { ...result.data, plain_english_summary: enforceSummarySuffix(result.data.plain_english_summary) };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
