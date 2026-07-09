import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGroupedHistory,
  type GroupedHistory,
  type HistoryMatchGroup,
  type HistoryOtherLine,
} from "@/lib/domain/world-cup/history-match-groups";

export type { GroupedHistory, HistoryMatchGroup, HistoryOtherLine };

export async function listGroupHistoryForUser(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  limit = 200,
): Promise<GroupedHistory> {
  const { data: contests, error: cErr } = await supabase
    .from("contests")
    .select("id")
    .eq("group_id", groupId);

  if (cErr) throw cErr;
  const contestIds = (contests ?? []).map((c) => c.id as string);
  if (contestIds.length === 0) return { matches: [], other: [] };

  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, voided, source_match_id")
    .in("contest_id", contestIds);

  if (evErr) throw evErr;

  const voidedByEventId = new Map<string, boolean>();
  const matchIdByEventId = new Map<string, string>();
  const matchIdsFromEvents = new Set<string>();

  for (const ev of events ?? []) {
    const eventId = ev.id as string;
    voidedByEventId.set(eventId, Boolean(ev.voided));
    const matchId = ev.source_match_id as string | null;
    if (matchId) {
      matchIdByEventId.set(eventId, matchId);
      matchIdsFromEvents.add(matchId);
    }
  }

  const { data: ledger, error: lErr } = await supabase
    .from("contest_points_ledger")
    .select(
      "id, contest_id, event_id, participant_id, action_type, points_delta, reason_text, created_at",
    )
    .in("contest_id", contestIds)
    .eq("participant_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (lErr) throw lErr;

  const ledgerRows = (ledger ?? []).map((row) => ({
    id: row.id as string,
    eventId: (row.event_id as string | null) ?? null,
    actionType: row.action_type as string,
    reasonText: (row.reason_text as string | null) ?? null,
    pointsDelta: Number(row.points_delta ?? 0),
    provisional: row.action_type === "provisional",
  }));

  const matchIds = new Set<string>(matchIdsFromEvents);
  for (const row of ledgerRows) {
    if (!row.eventId) continue;
    const matchId = matchIdByEventId.get(row.eventId);
    if (matchId) matchIds.add(matchId);
  }

  const matchIdList = [...matchIds];
  const matchesById = new Map<
    string,
    {
      id: string;
      matchNumber: number | null;
      homeTeam: string;
      awayTeam: string;
      winner: string | null;
      status: string;
    }
  >();

  if (matchIdList.length > 0) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, match_number, home_team, away_team, winner, status")
      .in("id", matchIdList);

    for (const match of matches ?? []) {
      matchesById.set(match.id as string, {
        id: match.id as string,
        matchNumber: (match.match_number as number | null) ?? null,
        homeTeam: (match.home_team as string) ?? "",
        awayTeam: (match.away_team as string) ?? "",
        winner: (match.winner as string | null) ?? null,
        status: (match.status as string) ?? "scheduled",
      });
    }
  }

  const predictionsByMatchId = new Map<
    string,
    { predictedWinner: string | null; bonusPick: string | null }
  >();
  if (matchIdList.length > 0) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("match_id, predicted_winner, bonus_pick")
      .eq("user_id", userId)
      .in("match_id", matchIdList);

    for (const pred of predictions ?? []) {
      predictionsByMatchId.set(pred.match_id as string, {
        predictedWinner: (pred.predicted_winner as string | null) ?? null,
        bonusPick: (pred.bonus_pick as string | null) ?? null,
      });
      matchIds.add(pred.match_id as string);
    }
  }

  const promptsByMatchId = new Map<
    string,
    { id: string; matchId: string; promptText: string; correctAnswer: string | null }[]
  >();
  const promptById = new Map<
    string,
    { id: string; matchId: string; promptText: string; correctAnswer: string | null }
  >();

  if (matchIdList.length > 0) {
    const { data: prompts } = await supabase
      .from("bonus_prompts")
      .select("id, match_id, prompt_text, correct_answer")
      .eq("scope", "match")
      .in("match_id", matchIdList)
      .order("display_order", { ascending: true });

    for (const prompt of prompts ?? []) {
      const row = {
        id: prompt.id as string,
        matchId: prompt.match_id as string,
        promptText: (prompt.prompt_text as string) ?? "",
        correctAnswer: (prompt.correct_answer as string | null) ?? null,
      };
      promptById.set(row.id, row);
      const list = promptsByMatchId.get(row.matchId) ?? [];
      list.push(row);
      promptsByMatchId.set(row.matchId, list);
    }
  }

  const promptIds = [...promptById.keys()];
  const optionsByPromptId = new Map<string, { value: string; label: string }[]>();
  if (promptIds.length > 0) {
    const { data: options } = await supabase
      .from("bonus_prompt_options")
      .select("prompt_id, value, label")
      .in("prompt_id", promptIds)
      .order("sort_order", { ascending: true });

    for (const opt of options ?? []) {
      const pid = opt.prompt_id as string;
      const list = optionsByPromptId.get(pid) ?? [];
      list.push({
        value: (opt.value as string) ?? "",
        label: (opt.label as string) ?? "",
      });
      optionsByPromptId.set(pid, list);
    }
  }

  const bonusAnswersByMatchPrompt = new Map<string, string>();
  if (matchIdList.length > 0) {
    const { data: bonusAnswers } = await supabase
      .from("prediction_bonus_answers")
      .select("match_id, prompt_id, answer_text")
      .eq("user_id", userId)
      .in("match_id", matchIdList);

    for (const answer of bonusAnswers ?? []) {
      const matchId = answer.match_id as string;
      matchIds.add(matchId);
      const key = `${matchId}\t${answer.prompt_id as string}`;
      bonusAnswersByMatchPrompt.set(key, (answer.answer_text as string) ?? "");
    }
  }

  return buildGroupedHistory({
    ledgerRows,
    matchIdByEventId,
    voidedByEventId,
    matchesById,
    predictionsByMatchId,
    promptsByMatchId,
    optionsByPromptId,
    bonusAnswersByMatchPrompt,
  });
}
