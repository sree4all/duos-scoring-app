import { isTournamentQuestionVisible } from "@/lib/utils/tournament-question-visibility";

export type GroupBonusPromptLike = {
  is_active: boolean;
  visible_after_utc: string | null;
  revealed_by_admin: boolean;
};

/** Participant-facing visibility for bonus/tournament prompts in group contests. */
export function isGroupBonusPromptVisible(
  prompt: GroupBonusPromptLike,
  now = new Date(),
): boolean {
  return isTournamentQuestionVisible(prompt, now);
}
