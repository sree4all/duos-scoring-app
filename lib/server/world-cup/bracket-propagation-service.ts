import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickMatchesFixture,
  shouldClearBonusAnswer,
  teamsRemovedFromFixture,
} from "@/lib/domain/world-cup/bracket-propagation";
import {
  MIN_PROPAGATION_MATCH_NUMBER,
  winnerSlotTargetsForSource,
} from "@/lib/domain/world-cup/knockout-bracket";

export type PropagationOutcome = {
  ok: true;
  propagatedMatchIds: string[];
  picksCleared: number;
  bonusAnswersCleared: number;
};

export type PropagationResult =
  | PropagationOutcome
  | { ok: false; error: string };

export async function propagateKnockoutTeams(
  supabase: SupabaseClient,
  sourceMatchId: string,
): Promise<PropagationResult> {
  const { data: source, error: sourceErr } = await supabase
    .from("matches")
    .select("id, match_number, season_year, winner, status")
    .eq("id", sourceMatchId)
    .maybeSingle();

  if (sourceErr) return { ok: false, error: sourceErr.message };
  if (!source) return { ok: false, error: "Match not found." };

  const matchNumber = source.match_number as number | null;
  const winner = (source.winner as string | null)?.trim();
  const seasonYear = (source.season_year as number | null) ?? 2026;

  if (
    matchNumber == null ||
    matchNumber < MIN_PROPAGATION_MATCH_NUMBER ||
    source.status !== "completed" ||
    !winner
  ) {
    return {
      ok: true,
      propagatedMatchIds: [],
      picksCleared: 0,
      bonusAnswersCleared: 0,
    };
  }

  const slotTargets = winnerSlotTargetsForSource(matchNumber);
  if (slotTargets.length === 0) {
    return {
      ok: true,
      propagatedMatchIds: [],
      picksCleared: 0,
      bonusAnswersCleared: 0,
    };
  }

  const propagatedMatchIds: string[] = [];
  let picksCleared = 0;
  let bonusAnswersCleared = 0;
  const now = new Date().toISOString();

  for (const target of slotTargets) {
    const { data: targetMatch, error: targetErr } = await supabase
      .from("matches")
      .select("id, home_team, away_team, status")
      .eq("season_year", seasonYear)
      .eq("match_number", target.targetMatchNumber)
      .maybeSingle();

    if (targetErr) return { ok: false, error: targetErr.message };
    if (!targetMatch) continue;
    if ((targetMatch.status as string) === "completed") continue;

    const targetId = targetMatch.id as string;
    const oldHome = targetMatch.home_team as string;
    const oldAway = targetMatch.away_team as string;
    const newHome = target.slot === "home" ? winner : oldHome;
    const newAway = target.slot === "away" ? winner : oldAway;

    if (newHome === oldHome && newAway === oldAway) continue;

    const { error: updateErr } = await supabase
      .from("matches")
      .update({
        home_team: newHome,
        away_team: newAway,
        updated_at: now,
      })
      .eq("id", targetId);

    if (updateErr) return { ok: false, error: updateErr.message };
    propagatedMatchIds.push(targetId);

    const affectedTeams = teamsRemovedFromFixture(oldHome, oldAway, newHome, newAway);

    const { data: predictions } = await supabase
      .from("predictions")
      .select("id, predicted_winner")
      .eq("match_id", targetId);

    const invalidIds = (predictions ?? [])
      .filter(
        (p) =>
          p.predicted_winner &&
          !pickMatchesFixture(newHome, newAway, p.predicted_winner as string),
      )
      .map((p) => p.id as string);

    if (invalidIds.length > 0) {
      const { error: delErr } = await supabase
        .from("predictions")
        .delete()
        .in("id", invalidIds);
      if (delErr) return { ok: false, error: delErr.message };
      picksCleared += invalidIds.length;
    }

    if (affectedTeams.length > 0) {
      const { data: bonusRows } = await supabase
        .from("prediction_bonus_answers")
        .select("id, answer_text")
        .eq("match_id", targetId);

      const bonusIdsToClear = (bonusRows ?? [])
        .filter((row) =>
          shouldClearBonusAnswer(row.answer_text as string, affectedTeams),
        )
        .map((row) => row.id as string);

      if (bonusIdsToClear.length > 0) {
        const { error: bonusDelErr } = await supabase
          .from("prediction_bonus_answers")
          .delete()
          .in("id", bonusIdsToClear);
        if (bonusDelErr) return { ok: false, error: bonusDelErr.message };
        bonusAnswersCleared += bonusIdsToClear.length;
      }
    }
  }

  return {
    ok: true,
    propagatedMatchIds,
    picksCleared,
    bonusAnswersCleared,
  };
}
