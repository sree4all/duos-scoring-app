import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { assertEventRevealedForMember } from "@/lib/server/world-cup/schedule-query";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";
import { MatchPickForm } from "@/components/world-cup/match-pick-form";
import { OwnerEventResultsForm } from "@/components/groups/owner-event-results-form";
import { OwnerMatchLockForm } from "@/components/world-cup/owner-match-lock-form";
import { worldCupCopy } from "@/lib/copy/world-cup";

type PageProps = { params: Promise<{ contestId: string; eventId: string }> };

export default async function EventSubmissionPage({ params }: PageProps) {
  const { contestId, eventId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  const membership = await requireGroupMembership(supabase, activeGroupId, user.id);
  await new GroupContestService(supabase).assertContestInGroup(contestId, activeGroupId);

  const { data: event } = await supabase
    .from("events")
    .select("id, title, lock_at, stage_key, source_match_id")
    .eq("id", eventId)
    .eq("contest_id", contestId)
    .maybeSingle();

  if (!event?.source_match_id) notFound();

  const reveal = await assertEventRevealedForMember(
    supabase,
    contestId,
    event.stage_key as string | null,
  );
  if (!reveal.ok) {
    return (
      <section className="space-y-4">
        <p className="text-sm">{reveal.message}</p>
        <Link href={`/contests/${contestId}/matches`} className="text-sm font-medium underline">
          Back to predictions
        </Link>
      </section>
    );
  }

  const matchId = event.source_match_id as string;
  const { data: match } = await supabase
    .from("matches")
    .select("home_team, away_team, match_time_utc, status")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) notFound();

  const lockAt = event.lock_at as string | null;
  const locked = Boolean(lockAt && new Date(lockAt).getTime() <= Date.now());

  const { data: existingPick } = await supabase
    .from("predictions")
    .select("predicted_winner")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Match prediction
        </p>
        <h1 className="text-2xl font-semibold">{event.title as string}</h1>
        <p className="text-lg font-medium">
          {match.home_team as string} vs {match.away_team as string}
        </p>
        <p className="text-sm text-muted-foreground">
          Kickoff (Eastern): {formatEasternDateTime(match.match_time_utc as string)}
        </p>
      </header>

      <MatchPickForm
        contestId={contestId}
        eventId={eventId}
        matchId={matchId}
        homeTeam={match.home_team as string}
        awayTeam={match.away_team as string}
        initialPick={(existingPick?.predicted_winner as string) ?? null}
        locked={locked}
      />

      {membership.isOwner ? (
        <details className="rounded-lg border p-4 text-sm">
          <summary className="cursor-pointer font-medium">Organizer tools</summary>
          <div className="mt-4 space-y-4">
            <OwnerMatchLockForm
              groupId={activeGroupId}
              contestId={contestId}
              eventId={eventId}
              lockAt={lockAt}
            />
            <OwnerEventResultsForm
              groupId={activeGroupId}
              contestId={contestId}
              matchId={matchId}
              eventId={eventId}
            />
          </div>
        </details>
      ) : null}

      <Link
        href={`/contests/${contestId}/matches`}
        className="inline-block text-sm font-medium underline"
      >
        ← Back to {worldCupCopy.nav.worldCupPredictions}
      </Link>
    </section>
  );
}
