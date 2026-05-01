export interface PresetScoreInput {
  contestId: string;
  participantId: string;
  presetKey: string;
  inputs: Record<string, unknown>;
}

export function evaluatePresetScore(input: PresetScoreInput) {
  const mode = String(input.inputs.gameMode ?? "prediction");
  if (mode === "prediction") {
    const submitted = String(input.inputs.submittedWinner ?? "");
    const actual = String(input.inputs.actualWinner ?? "");
    const bonusHit = Boolean(input.inputs.bonusHit);
    const base = submitted === actual ? 10 : 0;
    const bonus = bonusHit ? 5 : 0;
    return { pointsDelta: base + bonus, presetKey: input.presetKey };
  }
  if (mode === "score_entry") {
    const submitted = Number(input.inputs.submittedScore ?? 0);
    const actual = Number(input.inputs.actualScore ?? 0);
    const diff = Math.abs(submitted - actual);
    const points = Math.max(0, 10 - diff);
    return { pointsDelta: points, presetKey: input.presetKey };
  }
  return { pointsDelta: 0, presetKey: input.presetKey };
}
