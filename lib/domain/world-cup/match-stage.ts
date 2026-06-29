import type { StageKey } from "@/lib/domain/world-cup/types";

/** FIFA World Cup 2026 fixture numbering (104 matches). */
export function stageKeyFromMatchNumber(matchNumber: number): StageKey | null {
  if (!Number.isFinite(matchNumber) || matchNumber < 1) return null;
  if (matchNumber <= 72) return "group_stage";
  if (matchNumber <= 88) return "round_of_32";
  if (matchNumber <= 96) return "round_of_16";
  if (matchNumber <= 100) return "quarter_finals";
  if (matchNumber <= 102) return "semi_finals";
  if (matchNumber === 103) return "third_place";
  if (matchNumber === 104) return "final";
  return null;
}

export function parseMatchNumberFromExternalKey(externalKey: string | null | undefined): number | null {
  const key = (externalKey ?? "").trim();
  if (!key) return null;
  const wc = key.match(/^wc2026:m(\d+)$/i);
  if (wc) return Number(wc[1]);
  const suffix = key.match(/(?:^|:|\s)m?(\d{1,3})$/i);
  if (suffix) return Number(suffix[1]);
  if (/^\d+$/.test(key)) return Number(key);
  return null;
}

/** Final stage key for scoring: always reconcile with match_number. */
export function resolveMatchScoringStageKey(
  preferredStageKey: string | null | undefined,
  storedMatchStageKey: string | null | undefined,
  matchNumber: number | null | undefined,
): StageKey | undefined {
  return resolveScoringStageKey(preferredStageKey ?? storedMatchStageKey, matchNumber);
}

/**
 * Resolve the stage used for scoring. Knockout match numbers override a stale
 * `group_stage` (or missing) stage_key from early imports.
 */
export function resolveScoringStageKey(
  storedStageKey: string | null | undefined,
  matchNumber: number | null | undefined,
): StageKey | undefined {
  const fromNumber =
    matchNumber != null && Number.isFinite(matchNumber)
      ? stageKeyFromMatchNumber(matchNumber)
      : null;
  const stored = (storedStageKey?.trim() as StageKey | undefined) || undefined;

  if (fromNumber && fromNumber !== "group_stage") {
    if (!stored || stored === "group_stage") return fromNumber;
  }

  return stored ?? fromNumber ?? undefined;
}
