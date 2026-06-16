import { LEADERBOARD_MAX_ROWS } from "@/lib/world-cup/mobile-list";
import {
  computeStandingPlaces,
  standingPlaceEmoji,
} from "@/lib/utils/standing-place";

export type LeaderboardEntry = {
  participantId: string;
  displayName: string;
  totalPoints: number;
};

export function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No scores yet for this contest.</p>
    );
  }

  const visible = entries.slice(0, LEADERBOARD_MAX_ROWS);
  const truncated = entries.length > LEADERBOARD_MAX_ROWS;
  const places = computeStandingPlaces(visible.map((entry) => entry.totalPoints));

  return (
    <div>
      <ul className="space-y-2">
        {visible.map((entry, index) => (
          <li
            key={entry.participantId}
            className="neon-glass-card flex items-center justify-between gap-3 p-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="shrink-0 text-base leading-none"
                aria-label={`Rank ${places[index]}`}
              >
                {standingPlaceEmoji(places[index])}
              </span>
              <span className="truncate font-medium">{entry.displayName}</span>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-white">
              {entry.totalPoints} pts
            </span>
          </li>
        ))}
      </ul>
      {truncated ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing top {LEADERBOARD_MAX_ROWS} of {entries.length} players.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? "player" : "players"}
        </p>
      )}
    </div>
  );
}
