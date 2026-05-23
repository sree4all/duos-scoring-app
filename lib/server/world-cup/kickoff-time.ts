/**
 * Parse World Cup CSV `kickoff_at` into ISO UTC for `matches.match_time_utc`.
 * Wall-clock date/time is treated as US Eastern (spec 006). Trailing offset
 * (host city) is ignored for scheduling and display.
 */

import { easternWallClockToIsoUtc } from "@/lib/utils/eastern-time";

export type ParsedKickoff = {
  isoUtc: string;
  /** Always null on import; host-city suffix in CSV is not used. */
  tzOffset: null;
};

const KICKOFF_RE =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:[Zz]|[+-]\d{2}(?::?\d{2})?|[+-]\d{4})?$/;

export function parseKickoffCell(cell: string): ParsedKickoff {
  const raw = cell.trim();
  if (!raw) {
    throw new Error("empty kickoff_at");
  }

  const m = raw.match(KICKOFF_RE);
  if (m) {
    const [, date, time] = m;
    if (raw.endsWith("Z") || raw.endsWith("z")) {
      const d = new Date(`${date}T${time}Z`);
      if (!Number.isNaN(d.getTime())) {
        return { isoUtc: d.toISOString(), tzOffset: null };
      }
    }
    return { isoUtc: easternWallClockToIsoUtc(date, time), tzOffset: null };
  }

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return { isoUtc: d.toISOString(), tzOffset: null };
  }

  throw new Error(`Unrecognized kickoff_at: ${raw}`);
}

export function parseKickoffAtToIsoUtc(cell: string): string {
  return parseKickoffCell(cell).isoUtc;
}
