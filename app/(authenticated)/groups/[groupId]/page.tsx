import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupRepository } from "@/lib/server/groups/repository";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import {
  contestPrimaryLink,
  summarizeContestsByFormat,
} from "@/lib/server/groups/contest-summary";
import { setActiveGroupIdCookie } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";
import { GroupDualFormatPanel } from "@/components/onboarding/group-dual-format-panel";
import {
  ContestFormatBadge,
  ContestStateBadge,
} from "@/components/contests/contest-format-badge";

type PageProps = { params: Promise<{ groupId: string }> };

export default async function GroupDashboardPage({ params }: PageProps) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();

  const group = await new GroupRepository(supabase).getGroupById(groupId);
  if (!group) notFound();

  const membership = await requireGroupMembership(supabase, groupId, user.id);
  await setActiveGroupIdCookie(groupId);

  const contests = await new GroupContestService(supabase).listContests(groupId);
  const summary = summarizeContestsByFormat(contests);

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
              <ContestFormatBadge formatLabel={c.format_label} />
              <ContestStateBadge state={c.state} />
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">None yet</li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">Group home</p>
      </header>

      <GroupDualFormatPanel isOwner={membership.isOwner} />

      <div className="grid gap-6 sm:grid-cols-2">
        <ContestList title="World Cup Picks" items={summary.prediction} />
        <ContestList title="Rummy Scores" items={summary.rummy} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/contests" className="font-medium underline">
          All contests
        </Link>
        {membership.isOwner ? (
          <Link href={`/groups/${groupId}/contests/new`} className="font-medium underline">
            New contest
          </Link>
        ) : null}
        <Link href={`/groups/${groupId}/settings`} className="font-medium underline">
          Settings
        </Link>
      </div>
    </section>
  );
}
