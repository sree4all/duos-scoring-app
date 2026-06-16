import { normAnswer } from "@/lib/scoring/normalize";

export function bonusPointsForAnswer(
  userAnswer: string,
  officialAnswer: string,
  correctPoints: number,
  incorrectPenalty: number,
): number | null {
  const official = officialAnswer.trim();
  const userAns = userAnswer.trim();
  if (!official || !userAns) return null;

  if (normAnswer(userAns) === normAnswer(official)) {
    return correctPoints !== 0 ? correctPoints : null;
  }
  return incorrectPenalty !== 0 ? incorrectPenalty : null;
}

export function mergeScoringUserIds(
  predictionUserIds: Iterable<string>,
  bonusAnswerUserIds: Iterable<string>,
): string[] {
  return [...new Set([...predictionUserIds, ...bonusAnswerUserIds])];
}
