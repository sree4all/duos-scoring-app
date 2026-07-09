import { buildLinkedMatchEventTitle } from "@/lib/domain/world-cup/match-event-title";
import {
  classifyHistoryLine,
  parseBonusPromptId,
  resolveBonusAnswerDisplay,
  type HistoryLineKind,
} from "@/lib/domain/world-cup/history-line-detail";

export type HistoryBonusSection = {
  promptId: string;
  question: string;
  chosenAnswer: string | null;
  correctAnswer: string | null;
  pointsDelta: number | null;
};

export type HistoryWinnerSection = {
  predictedWinner: string | null;
  actualWinner: string | null;
  pointsDelta: number | null;
  provisional: boolean;
};

export type HistoryMatchGroup = {
  id: string;
  matchNumber: number | null;
  matchTitle: string;
  voided: boolean;
  winner: HistoryWinnerSection | null;
  bonuses: HistoryBonusSection[];
  totalPoints: number;
};

export type HistoryOtherLine = {
  id: string;
  label: string;
  pointsDelta: number;
  voided: boolean;
  provisional: boolean;
};

export type GroupedHistory = {
  matches: HistoryMatchGroup[];
  other: HistoryOtherLine[];
};

type LedgerRowInput = {
  id: string;
  eventId: string | null;
  actionType: string;
  reasonText: string | null;
  pointsDelta: number;
  provisional: boolean;
};

type MatchInput = {
  id: string;
  matchNumber: number | null;
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  status: string;
};

type PromptInput = {
  id: string;
  matchId: string;
  promptText: string;
  correctAnswer: string | null;
};

type OptionInput = { value: string; label: string };

export function buildGroupedHistory(input: {
  ledgerRows: LedgerRowInput[];
  matchIdByEventId: Map<string, string>;
  voidedByEventId: Map<string, boolean>;
  matchesById: Map<string, MatchInput>;
  predictionsByMatchId: Map<string, { predictedWinner: string | null; bonusPick: string | null }>;
  promptsByMatchId: Map<string, PromptInput[]>;
  optionsByPromptId: Map<string, OptionInput[]>;
  bonusAnswersByMatchPrompt: Map<string, string>;
}): GroupedHistory {
  const {
    ledgerRows,
    matchIdByEventId,
    voidedByEventId,
    matchesById,
    predictionsByMatchId,
    promptsByMatchId,
    optionsByPromptId,
    bonusAnswersByMatchPrompt,
  } = input;

  const other: HistoryOtherLine[] = [];
  const winnerPointsByMatch = new Map<string, { points: number; provisional: boolean }>();
  const bonusPointsByMatchPrompt = new Map<string, number>();

  for (const row of ledgerRows) {
    const eventId = row.eventId;
    const matchId = eventId ? (matchIdByEventId.get(eventId) ?? null) : null;
    const kind = classifyHistoryLine(row.actionType, row.reasonText);

    if (!matchId || kind === "other") {
      other.push({
        id: row.id,
        label: row.reasonText ?? row.actionType,
        pointsDelta: row.pointsDelta,
        voided: eventId ? Boolean(voidedByEventId.get(eventId)) : false,
        provisional: row.provisional,
      });
      continue;
    }

    if (kind === "match_winner" || kind === "match_winner_miss") {
      winnerPointsByMatch.set(matchId, {
        points: row.pointsDelta,
        provisional: row.provisional,
      });
      continue;
    }

    if (kind === "match_bonus") {
      const promptId =
        parseBonusPromptId(row.reasonText) ??
        promptsByMatchId.get(matchId)?.[0]?.id ??
        null;
      if (promptId) {
        bonusPointsByMatchPrompt.set(`${matchId}\t${promptId}`, row.pointsDelta);
      }
    }
  }

  const matchIds = new Set<string>([
    ...winnerPointsByMatch.keys(),
    ...bonusPointsByMatchPrompt.keys().map((key) => key.split("\t")[0]!),
    ...predictionsByMatchId.keys(),
    ...[...bonusAnswersByMatchPrompt.keys()].map((key) => key.split("\t")[0]!),
  ]);

  const matches: HistoryMatchGroup[] = [];

  for (const matchId of matchIds) {
    const match = matchesById.get(matchId);
    if (!match) continue;

    const matchTitle = buildLinkedMatchEventTitle(
      match.matchNumber,
      match.homeTeam,
      match.awayTeam,
    );
    const prediction = predictionsByMatchId.get(matchId) ?? null;
    const winnerLedger = winnerPointsByMatch.get(matchId);
    const prompts = promptsByMatchId.get(matchId) ?? [];

    const winner: HistoryWinnerSection | null =
      prediction?.predictedWinner?.trim() || winnerLedger
        ? {
            predictedWinner: prediction?.predictedWinner?.trim() || null,
            actualWinner:
              match.status === "completed" ? match.winner?.trim() || null : null,
            pointsDelta: winnerLedger?.points ?? null,
            provisional: winnerLedger?.provisional ?? false,
          }
        : null;

    const bonusByPromptId = new Map<string, HistoryBonusSection>();

    for (const prompt of prompts) {
      const options = optionsByPromptId.get(prompt.id) ?? [];
      const rawChosen =
        bonusAnswersByMatchPrompt.get(`${matchId}\t${prompt.id}`)?.trim() ||
        prediction?.bonusPick?.trim() ||
        null;
      const chosenAnswer = resolveBonusAnswerDisplay(rawChosen, options);
      const correctAnswer = resolveBonusAnswerDisplay(prompt.correctAnswer, options);
      const pointsKey = `${matchId}\t${prompt.id}`;
      const hasLedgerPoints = bonusPointsByMatchPrompt.has(pointsKey);
      const pointsDelta = hasLedgerPoints
        ? bonusPointsByMatchPrompt.get(pointsKey)!
        : chosenAnswer && match.status === "completed"
          ? 0
          : null;

      if (!chosenAnswer && !hasLedgerPoints) continue;

      bonusByPromptId.set(prompt.id, {
        promptId: prompt.id,
        question: prompt.promptText,
        chosenAnswer,
        correctAnswer,
        pointsDelta,
      });
    }

    for (const [key, points] of bonusPointsByMatchPrompt) {
      const [mid, promptId] = key.split("\t");
      if (mid !== matchId || bonusByPromptId.has(promptId!)) continue;
      const prompt = prompts.find((p) => p.id === promptId);
      if (!prompt) continue;
      const options = optionsByPromptId.get(prompt.id) ?? [];
      const rawChosen = bonusAnswersByMatchPrompt.get(key)?.trim() || null;
      bonusByPromptId.set(prompt.id, {
        promptId: prompt.id,
        question: prompt.promptText,
        chosenAnswer: resolveBonusAnswerDisplay(rawChosen, options),
        correctAnswer: resolveBonusAnswerDisplay(prompt.correctAnswer, options),
        pointsDelta: points,
      });
    }

    const bonuses = [...bonusByPromptId.values()];
    const winnerPoints = winner?.pointsDelta ?? 0;
    const bonusPoints = bonuses.reduce((sum, b) => sum + (b.pointsDelta ?? 0), 0);
    const voided = [...voidedByEventId.entries()]
      .filter(([eventId, isVoided]) => isVoided && matchIdByEventId.get(eventId) === matchId)
      .some(Boolean);

    if (!winner && bonuses.length === 0) continue;

    matches.push({
      id: matchId,
      matchNumber: match.matchNumber,
      matchTitle,
      voided,
      winner,
      bonuses,
      totalPoints: winnerPoints + bonusPoints,
    });
  }

  matches.sort((a, b) => {
    const matchDiff = (b.matchNumber ?? -1) - (a.matchNumber ?? -1);
    if (matchDiff !== 0) return matchDiff;
    return a.matchTitle.localeCompare(b.matchTitle);
  });

  return { matches, other };
}

export function flattenGroupedHistory(groups: GroupedHistory): {
  kind: HistoryLineKind | "match_group" | "other";
  id: string;
}[] {
  return [
    ...groups.matches.map((m) => ({ kind: "match_group" as const, id: m.id })),
    ...groups.other.map((o) => ({ kind: "other" as const, id: o.id })),
  ];
}
