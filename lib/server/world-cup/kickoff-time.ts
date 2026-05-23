/**
 * Parse World Cup CSV `kickoff_at` values into ISO UTC for `matches.match_time_utc`.
 * CSV uses local wall time + numeric offset, e.g. `2026-06-12 21:00:00-07` (9 PM Pacific).
 */

export type ParsedKickoff = {
  isoUtc: string;
  /** Normalized offset for storage/display, e.g. `-07:00`, or null for `Z`. */
  tzOffset: string | null;
};

function normalizeOffsetPart(offsetPart: string): string {
  const offset = offsetPart;
  if (offset === "Z" || offset === "z") return "Z";
  if (/^[+-]\d{2}$/.test(offset)) {
    return `${offset}:00`;
  }
  if (/^[+-]\d{4}$/.test(offset)) {
    return `${offset.slice(0, 3)}:${offset.slice(3)}`;
  }
  if (/^[+-]\d{2}:\d{2}$/.test(offset)) {
    return offset;
  }
  return offset;
}

export function parseKickoffCell(cell: string): ParsedKickoff {
  const raw = cell.trim();
  if (!raw) {
    throw new Error("empty kickoff_at");
  }

  const withOffset = raw.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})([Zz]|[+-]\d{2}(?::?\d{2})?|[+-]\d{4})$/,
  );
  if (withOffset) {
    const [, date, time, offsetPart] = withOffset;
    const offset = normalizeOffsetPart(offsetPart);
    const iso =
      offset === "Z" ? `${date}T${time}Z` : `${date}T${time}${offset}`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return {
        isoUtc: d.toISOString(),
        tzOffset: offset === "Z" ? null : offset,
      };
    }
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
