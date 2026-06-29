import { normAnswer } from "@/lib/scoring/normalize";

/** Match winner scoring delta for one pick (0 when no pick, no result, or zero-point rules). */
export function winnerPickDelta(
  predictedWinner: string | null | undefined,
  actualWinner: string | null | undefined,
  correctPoints: number,
  incorrectPenalty: number,
): number {
  const trimmedPick = predictedWinner?.trim();
  const actual = actualWinner?.trim();
  if (!trimmedPick || !actual) return 0;

  const correct = normAnswer(trimmedPick) === normAnswer(actual);
  if (correct && correctPoints !== 0) return correctPoints;
  if (!correct && incorrectPenalty !== 0) return incorrectPenalty;
  return 0;
}
