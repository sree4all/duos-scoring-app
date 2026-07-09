export type HistoryLineKind =
  | "match_winner"
  | "match_winner_miss"
  | "match_bonus"
  | "other";

export function classifyHistoryLine(
  actionType: string,
  reasonText: string | null,
): HistoryLineKind {
  const action = actionType.toLowerCase();
  const reason = (reasonText ?? "").toLowerCase();

  if (action === "match_winner_miss" || reason === "match_winner_miss") {
    return "match_winner_miss";
  }
  if (
    action === "match_winner" ||
    reason === "match_winner" ||
    reason.startsWith("match_winner:")
  ) {
    return "match_winner";
  }
  if (
    action === "match_bonus" ||
    action === "bonus" ||
    reason.startsWith("match_bonus")
  ) {
    return "match_bonus";
  }
  return "other";
}

export function parseBonusPromptId(reasonText: string | null): string | null {
  if (!reasonText) return null;
  const match = reasonText.match(/^match_bonus(?:_miss)?:([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}

export type BonusOption = { value: string; label: string };

export function resolveBonusAnswerDisplay(
  answer: string | null | undefined,
  options: BonusOption[],
): string | null {
  const trimmed = answer?.trim();
  if (!trimmed) return null;
  const option = options.find(
    (opt) => opt.value.trim() === trimmed || opt.label.trim() === trimmed,
  );
  return option?.label ?? trimmed;
}
