import type { ContestRow } from "@/lib/types/database";

export type GroupContestSummary = {
  prediction: ContestRow[];
  rummy: ContestRow[];
  other: ContestRow[];
};

export function summarizeContestsByFormat(contests: ContestRow[]): GroupContestSummary {
  const prediction: ContestRow[] = [];
  const rummy: ContestRow[] = [];
  const other: ContestRow[] = [];

  for (const contest of contests) {
    const label = contest.format_label ?? "prediction";
    if (label === "rummy_points") rummy.push(contest);
    else if (label === "prediction") prediction.push(contest);
    else other.push(contest);
  }

  return { prediction, rummy, other };
}

export function contestPrimaryLink(contest: ContestRow): string {
  if (contest.format_label === "rummy_points") {
    return `/contests/${contest.id}/rummy/record`;
  }
  const name = (contest.name ?? "").toLowerCase();
  if (name.includes("world cup") || name.includes("fifa")) {
    return `/contests/${contest.id}/matches`;
  }
  return `/contests/${contest.id}/leaderboard`;
}
