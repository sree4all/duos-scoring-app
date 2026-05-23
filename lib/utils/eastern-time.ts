const EASTERN = "America/New_York";

const easternPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function easternPartsAt(ms: number) {
  const map: Record<string, string> = {};
  for (const p of easternPartsFormatter.formatToParts(new Date(ms))) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    y: Number(map.year),
    mo: Number(map.month),
    d: Number(map.day),
    h: Number(map.hour),
    mi: Number(map.minute),
    s: Number(map.second),
  };
}

/** Interpret CSV date/time digits as US Eastern wall clock → UTC ISO. */
export function easternWallClockToIsoUtc(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi, s] = time.split(":").map(Number);

  let ms = Date.UTC(y, mo - 1, d, h, mi, s);
  for (let i = 0; i < 6; i++) {
    const got = easternPartsAt(ms);
    if (
      got.y === y &&
      got.mo === mo &&
      got.d === d &&
      got.h === h &&
      got.mi === mi &&
      got.s === s
    ) {
      break;
    }
    const desiredMs = Date.UTC(y, mo - 1, d, h, mi, s);
    const gotMs = Date.UTC(got.y, got.mo - 1, got.d, got.h, got.mi, got.s);
    ms += desiredMs - gotMs;
  }

  return new Date(ms).toISOString();
}

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
