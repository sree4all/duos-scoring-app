import { formatEasternDateTime } from "@/lib/utils/eastern-time";

/** Member-facing kickoff (spec 006): US Eastern only. */
export function formatKickoffDisplay(kickoffUtc: string): string {
  return `${formatEasternDateTime(kickoffUtc)} Eastern`;
}
