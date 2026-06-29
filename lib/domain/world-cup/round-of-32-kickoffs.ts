import { easternWallClockToIsoUtc } from "@/lib/utils/eastern-time";

/** FIFA World Cup 2026 Round of 32 kickoffs (US Eastern wall clock). */
export const ROUND_OF_32_KICKOFFS_ET: ReadonlyArray<{
  matchNumber: number;
  date: string;
  time: string;
}> = [
  { matchNumber: 73, date: "2026-06-28", time: "19:00:00" },
  { matchNumber: 74, date: "2026-06-29", time: "20:30:00" },
  { matchNumber: 75, date: "2026-06-30", time: "01:00:00" },
  { matchNumber: 76, date: "2026-06-29", time: "17:00:00" },
  { matchNumber: 77, date: "2026-06-30", time: "21:00:00" },
  { matchNumber: 78, date: "2026-06-30", time: "17:00:00" },
  { matchNumber: 79, date: "2026-07-01", time: "01:00:00" },
  { matchNumber: 80, date: "2026-07-01", time: "16:00:00" },
  { matchNumber: 81, date: "2026-07-02", time: "00:00:00" },
  { matchNumber: 82, date: "2026-07-01", time: "20:00:00" },
  { matchNumber: 83, date: "2026-07-02", time: "23:00:00" },
  { matchNumber: 84, date: "2026-07-02", time: "19:00:00" },
  { matchNumber: 85, date: "2026-07-03", time: "03:00:00" },
  { matchNumber: 86, date: "2026-07-03", time: "22:00:00" },
  { matchNumber: 87, date: "2026-07-04", time: "01:00:00" },
  { matchNumber: 88, date: "2026-07-03", time: "18:00:00" },
] as const;

export function roundOf32KickoffUtc(matchNumber: number): string | undefined {
  const row = ROUND_OF_32_KICKOFFS_ET.find((k) => k.matchNumber === matchNumber);
  if (!row) return undefined;
  return easternWallClockToIsoUtc(row.date, row.time);
}
