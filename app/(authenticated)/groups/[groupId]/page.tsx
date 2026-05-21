import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  contestPrimaryLink,
  summarizeContestsByFormat,
} from "@/lib/server/groups/contest-summary";
import { requireGroupPageAccess } from "@/lib/server/groups/member-access";
import { GroupDualFormatPanel } from "@/components/onboarding/group-dual-format-panel";
import {
  ContestFormatBadge,
  ContestStateBadge,
} from "@/components/contests/contest-format-badge";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { isWorldCupContest } from "@/lib/server/world-cup/resolve-group-contest";
import { worldCupCopy } from "@/lib/copy/world-cup";

type PageProps = { params: Promise<{ groupId: string }> };

export default async function GroupDashboardPage({ params }: PageProps) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();
  const privatePilot = isWorldCupPrivateMode();

  const { group, membership } = await requireGroupPageAccess(supabase, groupId, user.id);

  const contests = await new GroupContestService(supabase).listContests(groupId);
  const summary = summarizeContestsByFormat(contests);
  const worldCupContests = summary.prediction.filter((c) => isWorldCupContest(c));
  const pickContests = privatePilot ? worldCupContests : summary.prediction;

  function ContestList({
    title,
    items,
  }: {
    title: string;
    items: typeof contests;
  }) {
    return (
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <ul className="mt-2 space-y-2">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <Link href={contestPrimaryLink(c)} className="font-medium underline">
                {c.name}
              </Link>
              {!privatePilot ? (
                <>
                  <ContestFormatBadge formatLabel={c.format_label} />
                  <ContestStateBadge state={c.state} />
                </>
              ) : null}
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {privatePilot && membership.isOwner
                ? "Publish your World Cup contest, then import the schedule."
                : "Your organizer will open picks soon."}
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">
          {privatePilot ? "FIFA World Cup 2026 Prediction Game" : "Group home"}
        </p>
      </header>

      {!privatePilot ? <GroupDualFormatPanel isOwner={membership.isOwner} /> : null}

      {privatePilot ? (
        <ContestList title={worldCupCopy.nav.worldCupPicks} items={pickContests} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <ContestList title="World Cup Picks" items={summary.prediction} />
          <ContestList title="Rummy Scores" items={summary.rummy} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {!privatePilot ? (
          <Link href="/contests" className="font-medium underline">
            All contests
          </Link>
        ) : null}
        {membership.isOwner ? (
          <>
            <Link
              href={
                privatePilot
                  ? `/groups/${groupId}/world-cup${
                      pickContests[0] ? `?contestId=${pickContests[0]!.id}` : ""
                    }`
                  : `/groups/${groupId}/contests/new`
              }
              className="font-medium underline"
            >
              {privatePilot ? "World Cup organizer" : "New contest"}
            </Link>
            <Link href={`/groups/${groupId}/settings`} className="font-medium underline">
              Organizer settings
            </Link>
          </>
        ) : null}
        {!membership.isOwner && !privatePilot ? (
          <Link href={`/groups/${groupId}/settings`} className="font-medium underline">
            Settings
          </Link>
        ) : null}
      </div>
    </section>
  );
}
