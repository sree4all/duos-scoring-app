import { isSeasonBonusesTabVisible } from "@/lib/utils/season-bonuses-tab";

export type GroupTournamentConfigLike = {
  season_bonuses_visible_after_utc?: string | null;
  season_bonuses_revealed_by_admin?: boolean | null;
};

/** Season bonuses tab visibility for a group-scoped tournament config row. */
export function isGroupSeasonBonusesVisible(
  cfg: GroupTournamentConfigLike | null,
  now = new Date(),
): boolean {
  return isSeasonBonusesTabVisible(cfg, now);
}
