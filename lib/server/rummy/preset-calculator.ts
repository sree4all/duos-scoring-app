import type {
  PointsRummyPresetParams,
  RummyDropType,
  RummyHandPlayerInput,
} from "@/lib/domain/rummy/types";

export function computePlayerPoints(
  input: RummyHandPlayerInput,
  preset: PointsRummyPresetParams,
): number {
  if (input.dropType === "first") return preset.firstDropPenalty;
  if (input.dropType === "middle") return preset.middleDropPenalty;
  if (input.dropType === "full_count") return preset.fullCountPenalty;

  const raw = Math.max(0, input.unmeldedPoints ?? 0);
  return Math.min(raw, preset.maxPointsPerHand);
}

export function computeHandPoints(
  players: RummyHandPlayerInput[],
  preset: PointsRummyPresetParams,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const player of players) {
    result[player.participantId] = computePlayerPoints(player, preset);
  }
  return result;
}

export function validateHandInput(players: RummyHandPlayerInput[]): string | null {
  if (players.length < 2) return "At least two players are required";
  for (const player of players) {
    if (player.dropType && player.dropType !== "none") continue;
    if (player.unmeldedPoints === undefined || player.unmeldedPoints < 0) {
      return "Each player needs a drop type or unmelded points";
    }
  }
  return null;
}

export type { RummyDropType };
