/**
 * Tournament forecast stats tab visibility for group members.
 * Platform admins always see the tab; members see it only when revealed.
 */
export function isAdvancedBracketStatsTabVisible(
  cfg: { advanced_bracket_stats_visible_to_members?: boolean | null } | null,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  return Boolean(cfg?.advanced_bracket_stats_visible_to_members);
}
