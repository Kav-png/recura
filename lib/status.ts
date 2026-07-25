export type Severity = "danger" | "warn" | "info" | "stable";

export const severityMeta: Record<Severity, { label: string; dot: string; bg: string; text: string }> = {
  danger: { label: "Critical", dot: "bg-critical", bg: "bg-critical-bg", text: "text-critical" },
  warn: { label: "Warning", dot: "bg-warning", bg: "bg-warning-bg", text: "text-warning" },
  info: { label: "Info", dot: "bg-stable", bg: "bg-stable-bg", text: "text-stable" },
  stable: { label: "Stable", dot: "bg-stable", bg: "bg-stable-bg", text: "text-stable" },
};

export function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function daysSince(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
