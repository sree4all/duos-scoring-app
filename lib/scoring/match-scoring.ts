import type { SupabaseClient } from "@supabase/supabase-js";
import { normAnswer } from "@/lib/scoring/normalize";
import {
  bonusPointsForAnswer,
  mergeScoringUserIds,
} from "@/lib/scoring/match-bonus-scoring";

export type ScoringConfigRow = {
  season_year: number;
  match_winner_points: number;
  match_bonus_points: number;
};

export type MatchScoreOptions = {
  contestId?: string;
  stageKey?: string;
  auditReason?: string;
};

export type MatchScoreOutcome =
  | { ok: true; ledgerRows: number }
  | { ok: false; error: string };

type LedgerInsert = {
  user_id: string;
  source_type: "match" | "bonus";
  source_id: string;
  points_delta: number;
  reason: string | null;
  awarded_at: string;
};

const LEDGER_BATCH = 500;
/** Profile `.in()` chunk size (PostgREST URL limits). */
const PROFILE_ID_CHUNK = 150;
/** Parallel profile point updates per batch (reduces latency vs strict sequential). */
const PROFILE_UPDATE_CONCURRENCY = 40;

function sumByUser(rows: { user_id: string; points_delta: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of rows) {
    const uid = row.user_id;
    const d = Number(row.points_delta ?? 0);
    m.set(uid, (m.get(uid) ?? 0) + d);
  }
  return m;
}

async function resolveWinnerPoints(
  supabase: SupabaseClient,
  contestId: string | undefined,
  stageKey: string | undefined,
  fallbackWinnerPts: number,
): Promise<{ correct: number; incorrect: number }> {
  if (contestId && stageKey) {
    const { data } = await supabase
      .from("contest_stage_scoring_rules")
      .select("correct_points, incorrect_penalty")
      .eq("contest_id", contestId)
      .eq("stage_key", stageKey)
      .maybeSingle();
    if (data) {
      return {
        correct: Number(data.correct_points ?? 0),
        incorrect: Number(data.incorrect_penalty ?? 0),
      };
    }
  }
  return { correct: fallbackWinnerPts, incorrect: 0 };
}

export async function applyMatchScoring(
  supabase: SupabaseClient,
  matchId: string,
  seasonYear = 2026,
  options?: MatchScoreOptions,
): Promise<MatchScoreOutcome> {
  const { data: cfg, error: cErr } = await supabase
    .from("scoring_config")
    .select("season_year, match_winner_points, match_bonus_points")
    .eq("season_year", seasonYear)
    .maybeSingle();
  if (cErr || !cfg) {
    return { ok: false, error: cErr?.message ?? "missing scoring_config" };
  }

  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("id, external_key, status, winner, bonus_result, home_team, away_team, stage_key")
    .eq("id", matchId)
    .maybeSingle();
  if (mErr || !match) {
    return { ok: false, error: mErr?.message ?? "match not found" };
  }

  if (match.status !== "completed") {
    return { ok: false, error: "Match status must be completed before scoring." };
  }

  const stageKey = options?.stageKey ?? (match.stage_key as string | undefined);
  const stagePts = await resolveWinnerPoints(
    supabase,
    options?.contestId,
    stageKey,
    Number(cfg.match_winner_points ?? 0),
  );
  const winnerPts = stagePts.correct;
  const missPts = stagePts.incorrect;
  const bonusPts = Number(cfg.match_bonus_points ?? 0);

  const actualWinner = match.winner as string | null;
  const matchBonusResult = match.bonus_result as string | null;

  const { data: predictions, error: pErr } = await supabase
    .from("predictions")
    .select("id, user_id, match_id, predicted_winner, bonus_pick")
    .eq("match_id", matchId);
  if (pErr) {
    return { ok: false, error: pErr.message };
  }

  const { data: promptRows } = await supabase
    .from("bonus_prompts")
    .select("id, correct_answer, correct_points, incorrect_penalty, display_order")
    .eq("season_year", seasonYear)
    .eq("scope", "match")
    .eq("match_id", matchId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const promptsOrdered = promptRows ?? [];
  const promptIds = promptsOrdered.map((p) => p.id as string);

  let bonusAnswers: { user_id: string; prompt_id: string; answer_text: string }[] = [];
  if (promptIds.length > 0) {
    const { data: ba } = await supabase
      .from("prediction_bonus_answers")
      .select("user_id, prompt_id, answer_text")
      .eq("match_id", matchId)
      .in("prompt_id", promptIds);
    bonusAnswers = ba ?? [];
  }

  const answersByUserPrompt = new Map<string, string>();
  for (const row of bonusAnswers) {
    const key = `${row.user_id as string}\t${row.prompt_id as string}`;
    answersByUserPrompt.set(key, (row.answer_text as string) ?? "");
  }

  const usePerPromptBonus = promptsOrdered.length > 0;

  const { data: oldLedger } = await supabase
    .from("points_ledger")
    .select("user_id, points_delta")
    .eq("source_id", matchId)
    .in("source_type", ["match", "bonus"]);

  const refundByUser = sumByUser(oldLedger ?? []);

  const now = new Date().toISOString();
  const toInsert: LedgerInsert[] = [];

  const predByUser = new Map(
    (predictions ?? []).map((p) => [p.user_id as string, p]),
  );
  const scoringUserIds = mergeScoringUserIds(
    predByUser.keys(),
    bonusAnswers.map((b) => b.user_id as string),
  );

  for (const userId of scoringUserIds) {
    const pred = predByUser.get(userId);
    const predictedWinner = pred?.predicted_winner as string | undefined;

    if (predictedWinner && actualWinner) {
      const correct = normAnswer(predictedWinner) === normAnswer(actualWinner);
      if (correct && winnerPts !== 0) {
        toInsert.push({
          user_id: userId,
          source_type: "match",
          source_id: matchId,
          points_delta: winnerPts,
          reason: options?.auditReason ? `match_winner:${options.auditReason}` : "match_winner",
          awarded_at: now,
        });
      } else if (!correct && missPts !== 0) {
        toInsert.push({
          user_id: userId,
          source_type: "match",
          source_id: matchId,
          points_delta: missPts,
          reason: "match_winner_miss",
          awarded_at: now,
        });
      }
    }

    if (usePerPromptBonus) {
      for (const pr of promptsOrdered) {
        const pid = pr.id as string;
        const official = (pr.correct_answer as string | null)?.trim() ?? "";
        const userAns = answersByUserPrompt.get(`${userId}\t${pid}`)?.trim() ?? "";
        const promptCorrectPts = Number(pr.correct_points ?? bonusPts);
        const promptMissPts = Number(pr.incorrect_penalty ?? 0);
        const delta = bonusPointsForAnswer(
          userAns,
          official,
          promptCorrectPts,
          promptMissPts,
        );
        if (delta === null) continue;
        const correct = normAnswer(userAns) === normAnswer(official);
        toInsert.push({
          user_id: userId,
          source_type: "bonus",
          source_id: matchId,
          points_delta: delta,
          reason: correct ? `match_bonus:${pid}` : `match_bonus_miss:${pid}`,
          awarded_at: now,
        });
      }
    } else if (matchBonusResult && pred) {
      const singleBonusPick = (pred.bonus_pick as string | null)?.trim();
      let fromPrompts = "";
      if (promptIds.length > 0) {
        const sorted = bonusAnswers.filter((b) => b.user_id === userId);
        sorted.sort(
          (a, b) =>
            promptIds.indexOf(a.prompt_id as string) - promptIds.indexOf(b.prompt_id as string),
        );
        fromPrompts = sorted[0]?.answer_text?.trim() ?? "";
      }
      const userBonus = singleBonusPick || fromPrompts;
      if (userBonus && normAnswer(userBonus) === normAnswer(matchBonusResult)) {
        toInsert.push({
          user_id: userId,
          source_type: "bonus",
          source_id: matchId,
          points_delta: bonusPts,
          reason: "match_bonus",
          awarded_at: now,
        });
      }
    }

  }

  const awardByUser = sumByUser(toInsert);

  // Replace ledger rows for this match in one shot (audit lines vary by bonus prompts).
  // Profile points use net delta (award − refund), not full strip/re-add.
  if (oldLedger?.length) {
    const { error: delErr } = await supabase
      .from("points_ledger")
      .delete()
      .eq("source_id", matchId)
      .in("source_type", ["match", "bonus"]);
    if (delErr) {
      return { ok: false, error: delErr.message };
    }
  }

  for (let i = 0; i < toInsert.length; i += LEDGER_BATCH) {
    const chunk = toInsert.slice(i, i + LEDGER_BATCH);
    const { error: insErr } = await supabase.from("points_ledger").insert(chunk);
    if (insErr) {
      return { ok: false, error: insErr.message };
    }
  }

  const userIdsForNet = new Set<string>([...refundByUser.keys(), ...awardByUser.keys()]);
  const nets = new Map<string, number>();
  for (const uid of userIdsForNet) {
    const net = (awardByUser.get(uid) ?? 0) - (refundByUser.get(uid) ?? 0);
    if (net !== 0) nets.set(uid, net);
  }

  if (nets.size > 0) {
    const ids = [...nets.keys()];
    const byId = new Map<string, number>();
    for (let i = 0; i < ids.length; i += PROFILE_ID_CHUNK) {
      const slice = ids.slice(i, i + PROFILE_ID_CHUNK);
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, current_points")
        .in("id", slice);
      if (profErr) {
        return { ok: false, error: profErr.message };
      }
      for (const p of profs ?? []) {
        byId.set(p.id as string, Number(p.current_points ?? 0));
      }
    }
    for (let i = 0; i < ids.length; i += PROFILE_UPDATE_CONCURRENCY) {
      const slice = ids.slice(i, i + PROFILE_UPDATE_CONCURRENCY);
      const results = await Promise.all(
        slice.map((uid) => {
          const net = nets.get(uid)!;
          const cur = byId.get(uid) ?? 0;
          return supabase
            .from("profiles")
            .update({
              current_points: cur + net,
              updated_at: now,
            })
            .eq("id", uid);
        }),
      );
      for (const r of results) {
        if (r.error) {
          return { ok: false, error: r.error.message };
        }
      }
    }
  }

  await supabase.from("matches").update({ scored_at: now, updated_at: now }).eq("id", matchId);

  return { ok: true, ledgerRows: toInsert.length };
}
