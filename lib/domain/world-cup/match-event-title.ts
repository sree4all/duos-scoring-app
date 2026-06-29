/** Contest event title for a fixture linked to matches.source_match_id. */
export function buildLinkedMatchEventTitle(
  matchNumber: number | null | undefined,
  homeTeam: string,
  awayTeam: string,
): string {
  const home = homeTeam.trim() || "TBD";
  const away = awayTeam.trim() || "TBD";
  if (matchNumber != null && Number.isFinite(matchNumber)) {
    return `Match ${matchNumber}: ${home} vs ${away}`;
  }
  return `${home} vs ${away}`;
}
