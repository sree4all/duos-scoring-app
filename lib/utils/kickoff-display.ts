import { formatEasternDateTime } from "@/lib/utils/eastern-time";

/** IANA Etc/GMT uses POSIX sign (GMT+7 = UTC−7). */
function tzOffsetToEtcGmt(tzOffset: string): string {
  const m = tzOffset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return "UTC";
  const sign = m[1] === "-" ? "+" : "-";
  const hours = Number(m[2]);
  if (hours === 0) return "Etc/GMT";
  return `Etc/GMT${sign}${hours}`;
}

/** Wall-clock time in the CSV host offset (matches `kickoff_at` in the dataset). */
export function formatWallClockInOffset(
  isoUtc: string,
  tzOffset: string,
): string {
  const d = new Date(isoUtc);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tzOffsetToEtcGmt(tzOffset),
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

/**
 * Member-facing kickoff: stadium/local time from CSV offset when known, plus Eastern.
 */
export function formatKickoffDisplay(
  kickoffUtc: string,
  kickoffTzOffset?: string | null,
): string {
  if (kickoffTzOffset) {
    const local = formatWallClockInOffset(kickoffUtc, kickoffTzOffset);
    const eastern = formatEasternDateTime(kickoffUtc);
    return `${local} · ${eastern} Eastern`;
  }
  return `${formatEasternDateTime(kickoffUtc)} Eastern`;
}
