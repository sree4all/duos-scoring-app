export interface ScoreProjectionInput {
  basePoints: number;
  adjustment: number;
}

export interface LedgerLineProjection {
  label: string;
  points: number;
  sourceType:
    | "match"
    | "bonus"
    | "season_bonus"
    | "adjustment"
    | "void_reversal"
    | "match_miss";
}

export function projectScore(input: ScoreProjectionInput) {
  return input.basePoints + input.adjustment;
}

/** Itemized leaderboard/history lines including bonus breakdown. */
export function projectLedgerLines(
  lines: { actionType: string; pointsDelta: number; reasonText?: string | null }[],
): LedgerLineProjection[] {
  return lines.map((line) => {
    const action = line.actionType.toLowerCase();
    let sourceType: LedgerLineProjection["sourceType"] = "adjustment";
    let label = line.reasonText ?? line.actionType;

    if (action.includes("bonus") && action.includes("season")) {
      sourceType = "season_bonus";
      label = line.reasonText ?? "Season bonus";
    } else if (action.includes("bonus")) {
      sourceType = "bonus";
      label = line.reasonText ?? "Bonus";
    } else if (action.includes("miss") || line.reasonText === "match_winner_miss") {
      sourceType = "match_miss";
      label = "Wrong winner pick";
    } else if (action.includes("match") || action.includes("winner")) {
      sourceType = "match";
      label = line.reasonText?.startsWith("match_winner")
        ? "Correct winner pick"
        : (line.reasonText ?? "Match winner");
    } else if (action.includes("void")) {
      sourceType = "void_reversal";
      label = line.reasonText ?? "Void reversal";
    }

    return {
      label,
      points: line.pointsDelta,
      sourceType,
    };
  });
}

export function sumProjectedPoints(lines: LedgerLineProjection[]): number {
  return lines.reduce((sum, line) => sum + line.points, 0);
}

export type ContestLeaderboardEntry = {
  participantId: string;
  totalPoints: number;
};

/**
 * Aggregates ledger rows for a single contest only (no cross-contest merge).
 */
export function aggregateLeaderboardForContest(
  ledgerRows: { participantId: string; pointsDelta: number }[],
  options?: { lowerTotalWins?: boolean },
): ContestLeaderboardEntry[] {
  const totals = new Map<string, number>();
  for (const row of ledgerRows) {
    totals.set(
      row.participantId,
      (totals.get(row.participantId) ?? 0) + row.pointsDelta,
    );
  }

  const entries = [...totals.entries()].map(([participantId, totalPoints]) => ({
    participantId,
    totalPoints,
  }));

  return entries.sort((a, b) =>
    options?.lowerTotalWins ? a.totalPoints - b.totalPoints : b.totalPoints - a.totalPoints,
  );
}
