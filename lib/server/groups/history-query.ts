import type { SupabaseClient } from "@supabase/supabase-js";
import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import {
  classifyHistoryLine,
  parseBonusPromptId,
  resolveBonusAnswerDisplay,
  type HistoryLineKind,
} from "@/lib/domain/world-cup/history-line-detail";

export type HistoryLineItem = {
  id: string;
  contestId: string;
  eventId: string | null;
  participantId: string;
  actionType: string;
  pointsDelta: number;
  reasonText: string | null;
  matchNumber: number | null;
  createdAt: string;
  voided?: boolean;
  provisional?: boolean;
  kind: HistoryLineKind;
  matchTitle: string | null;
  predictedWinner: string | null;
  actualWinner: string | null;
  bonusQuestion: string | null;
  chosenAnswer: string | null;
  correctAnswer: string | null;
  fallbackLabel: string | null;
};

type MatchRow = {
  id: string;
  matchNumber: number | null;
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  bonusResult: string | null;
};

type PredictionRow = {
  predictedWinner: string | null;
  bonusPick: string | null;
};

type PromptRow = {
  id: string;
  matchId: string;
  promptText: string;
  correctAnswer: string | null;
};

function fallbackLabelForKind(kind: HistoryLineKind, reasonText: string | null): string | null {
  if (kind === "match_winner") return "Correct winner pick";
  if (kind === "match_winner_miss") return "Wrong winner pick";
  if (kind === "match_bonus") return "Bonus question";
  return reasonText;
}

export async function listGroupHistoryForUser(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  limit = 100,
): Promise<HistoryLineItem[]> {
  const { data: contests, error: cErr } = await supabase
    .from("contests")
    .select("id")
    .eq("group_id", groupId);

  if (cErr) throw cErr;
  const contestIds = (contests ?? []).map((c) => c.id as string);
  if (contestIds.length === 0) return [];

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
  if (!ledger?.length) return [];

  const eventIds = [
    ...new Set(ledger.map((r) => r.event_id as string | null).filter(Boolean)),
  ] as string[];

  const voidedByEvent = new Map<string, boolean>();
  const matchIdByEventId = new Map<string, string>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, voided, source_match_id")
      .in("id", eventIds);

    for (const ev of events ?? []) {
      const eventId = ev.id as string;
      voidedByEvent.set(eventId, Boolean(ev.voided));
      const matchId = ev.source_match_id as string | null;
      if (matchId) matchIdByEventId.set(eventId, matchId);
    }
  }

  const matchIds = [...new Set(matchIdByEventId.values())];
  const matchById = new Map<string, MatchRow>();
  if (matchIds.length > 0) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, match_number, home_team, away_team, winner, bonus_result")
      .in("id", matchIds);

    for (const match of matches ?? []) {
      matchById.set(match.id as string, {
        id: match.id as string,
        matchNumber: (match.match_number as number | null) ?? null,
        homeTeam: (match.home_team as string) ?? "",
        awayTeam: (match.away_team as string) ?? "",
        winner: (match.winner as string | null) ?? null,
        bonusResult: (match.bonus_result as string | null) ?? null,
      });
    }
  }

  const predictionByMatchId = new Map<string, PredictionRow>();
  if (matchIds.length > 0) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("match_id, predicted_winner, bonus_pick")
      .eq("user_id", userId)
      .in("match_id", matchIds);

    for (const pred of predictions ?? []) {
      predictionByMatchId.set(pred.match_id as string, {
        predictedWinner: (pred.predicted_winner as string | null) ?? null,
        bonusPick: (pred.bonus_pick as string | null) ?? null,
      });
    }
  }

  const promptById = new Map<string, PromptRow>();
  const promptsByMatchId = new Map<string, PromptRow[]>();
  if (matchIds.length > 0) {
    const { data: prompts } = await supabase
      .from("bonus_prompts")
      .select("id, match_id, prompt_text, correct_answer")
      .eq("scope", "match")
      .in("match_id", matchIds)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    for (const prompt of prompts ?? []) {
      const row: PromptRow = {
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

  const bonusAnswerByMatchPrompt = new Map<string, string>();
  if (matchIds.length > 0 && promptIds.length > 0) {
    const { data: bonusAnswers } = await supabase
      .from("prediction_bonus_answers")
      .select("match_id, prompt_id, answer_text")
      .eq("user_id", userId)
      .in("match_id", matchIds)
      .in("prompt_id", promptIds);

    for (const answer of bonusAnswers ?? []) {
      const key = `${answer.match_id as string}\t${answer.prompt_id as string}`;
      bonusAnswerByMatchPrompt.set(key, (answer.answer_text as string) ?? "");
    }
  }

  const rows = ledger.map((row) => {
    const eventId = (row.event_id as string | null) ?? null;
    const matchId = eventId ? (matchIdByEventId.get(eventId) ?? null) : null;
    const match = matchId ? (matchById.get(matchId) ?? null) : null;
    const prediction = matchId ? (predictionByMatchId.get(matchId) ?? null) : null;
    const actionType = row.action_type as string;
    const reasonText = (row.reason_text as string | null) ?? null;
    const kind = classifyHistoryLine(actionType, reasonText);

    const matchTitle = match
      ? buildLinkedMatchEventTitle(match.matchNumber, match.homeTeam, match.awayTeam)
      : null;
    const matchNumber = match?.matchNumber ?? null;

    let predictedWinner: string | null = null;
    let actualWinner: string | null = null;
    let bonusQuestion: string | null = null;
    let chosenAnswer: string | null = null;
    let correctAnswer: string | null = null;

    if (kind === "match_winner" || kind === "match_winner_miss") {
      predictedWinner = prediction?.predictedWinner?.trim() || null;
      actualWinner = match?.winner?.trim() || null;
    } else if (kind === "match_bonus" && matchId) {
      const promptId = parseBonusPromptId(reasonText);
      const prompt =
        (promptId ? promptById.get(promptId) : null) ??
        promptsByMatchId.get(matchId)?.[0] ??
        null;

      if (prompt) {
        bonusQuestion = prompt.promptText || null;
        const options = optionsByPromptId.get(prompt.id) ?? [];
        const rawChosen =
          bonusAnswerByMatchPrompt.get(`${matchId}\t${prompt.id}`)?.trim() ||
          prediction?.bonusPick?.trim() ||
          null;
        chosenAnswer = resolveBonusAnswerDisplay(rawChosen, options);
        correctAnswer = resolveBonusAnswerDisplay(prompt.correctAnswer, options);
      } else if (match?.bonusResult) {
        bonusQuestion = "Match bonus";
        chosenAnswer = resolveBonusAnswerDisplay(prediction?.bonusPick, []);
        correctAnswer = resolveBonusAnswerDisplay(match.bonusResult, []);
      }
    }

    return {
      id: row.id as string,
      contestId: row.contest_id as string,
      eventId,
      participantId: row.participant_id as string,
      actionType,
      pointsDelta: Number(row.points_delta ?? 0),
      reasonText,
      matchNumber,
      createdAt: row.created_at as string,
      voided: eventId ? voidedByEvent.get(eventId) : false,
      provisional: actionType === "provisional",
      kind,
      matchTitle,
      predictedWinner,
      actualWinner,
      bonusQuestion,
      chosenAnswer,
      correctAnswer,
      fallbackLabel: fallbackLabelForKind(kind, reasonText),
    };
  });

  return rows.sort((a, b) => {
    const matchDiff = (b.matchNumber ?? -1) - (a.matchNumber ?? -1);
    if (matchDiff !== 0) return matchDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
