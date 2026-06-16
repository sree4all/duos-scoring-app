"use client";

import { OwnerMatchBonusPanel } from "@/components/world-cup/owner-match-bonus-panel";
import { OwnerMatchLockForm } from "@/components/world-cup/owner-match-lock-form";
import { OwnerMatchResultForm } from "@/components/world-cup/owner-match-result-form";
import { OwnerEventResultsForm } from "@/components/groups/owner-event-results-form";

export function MatchOrganizerTools({
  groupId,
  contestId,
  eventId,
  matchId,
  homeTeam,
  awayTeam,
  allowDraw,
  lockAt,
  initialWinner,
}: {
  groupId: string;
  contestId: string;
  eventId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  allowDraw: boolean;
  lockAt: string | null;
  initialWinner: string | null;
}) {
  return (
    <details className="rounded-lg border border-white/10 bg-white/5 text-sm">
      <summary className="cursor-pointer px-3 py-2 font-medium touch-manipulation">
        Organizer tools
      </summary>
      <div className="space-y-4 border-t border-white/10 p-3">
        <OwnerMatchBonusPanel groupId={groupId} contestId={contestId} matchId={matchId} />
        <OwnerMatchLockForm
          groupId={groupId}
          contestId={contestId}
          eventId={eventId}
          lockAt={lockAt}
        />
        <OwnerMatchResultForm
          groupId={groupId}
          contestId={contestId}
          matchId={matchId}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          allowDraw={allowDraw}
          initialWinner={initialWinner}
        />
        <OwnerEventResultsForm
          groupId={groupId}
          contestId={contestId}
          matchId={matchId}
          eventId={eventId}
        />
      </div>
    </details>
  );
}
