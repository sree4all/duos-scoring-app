const EASTERN = "America/New_York";

export function formatEasternDateTime(isoUtc: string | Date): string {
  const d = typeof isoUtc === "string" ? new Date(isoUtc) : isoUtc;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

export function formatEasternDate(isoUtc: string | Date): string {
  const d = typeof isoUtc === "string" ? new Date(isoUtc) : isoUtc;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN,
    month: "short",
    day: "numeric",
  }).format(d);
}
