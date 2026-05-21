import type { StageKey } from "@/lib/domain/world-cup/types";

/** Canonical stored value for a regulation draw (group stage only). */
export const MATCH_DRAW_PICK = "Draw";

export function isGroupStage(stageKey: string | null | undefined): boolean {
  return stageKey === "group_stage";
}

export function allowsDrawPick(stageKey: string | null | undefined): boolean {
  return isGroupStage(stageKey);
}

export function normMatchOutcome(s: string | null | undefined): string {
  return (s ?? "").trim().toUpperCase();
}

export function isDrawOutcome(value: string): boolean {
  const n = normMatchOutcome(value);
  return n === "DRAW" || n === "TIE";
}

/** Member-facing label for a saved pick. */
export function formatMatchPickLabel(pick: string): string {
  if (isDrawOutcome(pick) || normMatchOutcome(pick) === normMatchOutcome(MATCH_DRAW_PICK)) {
    return MATCH_DRAW_PICK;
  }
  return pick;
}

/** Normalize CSV/import or owner input to canonical home name, away name, or Draw. */
export function normalizeOfficialWinner(
  raw: string,
  homeTeam: string,
  awayTeam: string,
  stageKey: string | null | undefined,
): string | null {
  const t = raw.trim();
  if (!t) return null;

  if (isDrawOutcome(t)) {
    if (!allowsDrawPick(stageKey)) return null;
    return MATCH_DRAW_PICK;
  }

  if (normMatchOutcome(t) === normMatchOutcome(homeTeam)) return homeTeam;
  if (normMatchOutcome(t) === normMatchOutcome(awayTeam)) return awayTeam;
  return t;
}

export type PickValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateMatchPick(
  stageKey: string | null | undefined,
  pick: string,
  homeTeam: string,
  awayTeam: string,
): PickValidationResult {
  const trimmed = pick.trim();
  if (!trimmed) {
    return { ok: false, error: "Choose a prediction." };
  }

  if (isDrawOutcome(trimmed) || normMatchOutcome(trimmed) === normMatchOutcome(MATCH_DRAW_PICK)) {
    if (!allowsDrawPick(stageKey)) {
      return { ok: false, error: "Draw is only available for group stage matches." };
    }
    return { ok: true, value: MATCH_DRAW_PICK };
  }

  if (normMatchOutcome(trimmed) === normMatchOutcome(homeTeam)) {
    return { ok: true, value: homeTeam };
  }
  if (normMatchOutcome(trimmed) === normMatchOutcome(awayTeam)) {
    return { ok: true, value: awayTeam };
  }

  if (allowsDrawPick(stageKey)) {
    return { ok: false, error: "Pick the home team, away team, or Draw." };
  }
  return { ok: false, error: "Pick the home team or away team." };
}

export function validateOfficialWinner(
  stageKey: StageKey | string | null | undefined,
  winner: string,
  homeTeam: string,
  awayTeam: string,
): PickValidationResult {
  const normalized = normalizeOfficialWinner(winner, homeTeam, awayTeam, stageKey);
  if (!normalized) {
    if (isDrawOutcome(winner) && !allowsDrawPick(stageKey)) {
      return {
        ok: false,
        error: "Knockout matches cannot end in a draw. Enter the team that won (after extra time or penalties).",
      };
    }
    return { ok: false, error: "Enter a valid result." };
  }
  return { ok: true, value: normalized };
}
