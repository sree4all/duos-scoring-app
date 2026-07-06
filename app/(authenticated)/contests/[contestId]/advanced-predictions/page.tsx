import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { AdvancedBracketPredictionsForm } from "@/components/world-cup/advanced-bracket-predictions-form";
import { AdvancedBracketOwnerPanel } from "@/components/world-cup/advanced-bracket-owner-panel";
import {
  getAdvancedBracketAccess,
  loadAdvancedBracketOfficial,
  loadUserAdvancedBracketPicks,
} from "@/lib/server/world-cup/advanced-bracket-service";
import {
  loadForecastEligibility,
} from "@/lib/server/world-cup/round-of-32-teams";
import { resolveContestPageBackground } from "@/lib/design/resolve-page-background";
import { PageHeroLayer } from "@/components/layout/page-hero-layer";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function AdvancedPredictionsPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  const membership = await requireGroupMembership(supabase, activeGroupId, user.id);
  const contest = await new GroupContestService(supabase).assertContestInGroup(
    contestId,
    activeGroupId,
  );

  const [access, eligibility, initialPicks, official] = await Promise.all([
    getAdvancedBracketAccess(supabase, contestId),
    loadForecastEligibility(supabase),
    loadUserAdvancedBracketPicks(supabase, contestId, user.id),
    loadAdvancedBracketOfficial(supabase, contestId),
  ]);

  const pageBackground = resolveContestPageBackground(
    contest,
    `/contests/${contestId}/advanced-predictions`,
  );

  return (
    <section className="relative space-y-5 pb-4">
      {pageBackground ? <PageHeroLayer pageBackground={pageBackground} /> : null}
      <header className="relative z-[1]">
        <h1 className="text-title-dense">{worldCupCopy.advancedBracket.title}</h1>
        <p className="text-sm text-muted-foreground">{contest.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {worldCupCopy.advancedBracket.subtitle}
        </p>
      </header>

      <div className="relative z-[1] flex flex-wrap gap-3 text-sm">
        <Link href={`/contests/${contestId}/matches`} className="underline">
          {worldCupCopy.nav.worldCupPredictions}
        </Link>
        <Link href={`/contests/${contestId}/leaderboard`} className="underline">
          {worldCupCopy.nav.standings}
        </Link>
      </div>

      <div className="relative z-[1] rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
        <h2 className="font-semibold">{worldCupCopy.advancedBracket.pointsTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>{worldCupCopy.advancedBracket.pointsSemi}</li>
          <li>{worldCupCopy.advancedBracket.pointsFinal}</li>
          <li>{worldCupCopy.advancedBracket.pointsWinner}</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {worldCupCopy.advancedBracket.scoredAfterSemi}{" "}
          {worldCupCopy.advancedBracket.scoredAfterFinal}
        </p>
      </div>

      {official ? (
        <div className="relative z-[1] rounded-lg border border-dashed p-4 text-sm">
          <h2 className="font-semibold">Official results</h2>
          <dl className="mt-2 space-y-2 text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">
                {worldCupCopy.advancedBracket.officialSemi}
              </dt>
              <dd>
                {official.semiFinalistsScoredAt
                  ? official.semiFinalistTeams.join(", ")
                  : worldCupCopy.advancedBracket.notScoredYet}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">
                {worldCupCopy.advancedBracket.officialFinal}
              </dt>
              <dd>
                {official.finalistsScoredAt
                  ? official.finalistTeams.join(", ")
                  : worldCupCopy.advancedBracket.notScoredYet}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">
                {worldCupCopy.advancedBracket.officialWinner}
              </dt>
              <dd>
                {official.winnerScoredAt
                  ? official.winnerTeam
                  : worldCupCopy.advancedBracket.notScoredYet}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {!access.open ? (
        <div className="relative z-[1] rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {access.message ?? worldCupCopy.advancedBracket.notOpenYet}
        </div>
      ) : eligibility.eligible_teams.length === 0 ? (
        <div className="relative z-[1] rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Round of 32 teams are not available yet. Import the schedule first.
        </div>
      ) : (
        <div className="relative z-[1]">
          <AdvancedBracketPredictionsForm
            contestId={contestId}
            eligibility={eligibility}
            initialPicks={initialPicks}
            locked={access.locked}
          />
        </div>
      )}

      {membership.isOwner && isWorldCupPrivateMode() ? (
        <div className="relative z-[1]">
          <AdvancedBracketOwnerPanel groupId={activeGroupId} contestId={contestId} official={official} />
        </div>
      ) : null}
    </section>
  );
}
