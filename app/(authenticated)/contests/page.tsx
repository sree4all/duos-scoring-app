import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { contestPrimaryLink } from "@/lib/server/groups/contest-summary";
import {
  ContestFormatBadge,
  ContestStateBadge,
} from "@/components/contests/contest-format-badge";

export default async function ParticipantContestsPage() {
  const { supabase, user } = await requireUser();
  const activeGroupId = isGroupScopingEnabled()
    ? await resolveActiveGroupId(supabase, user.id)
    : null;

  if (!activeGroupId) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Active contests</h1>
        <p className="text-sm text-muted-foreground">
          Create or join a private group to see contests for your team.
        </p>
        <div className="flex gap-3">
          <Link href="/groups/new" className="font-medium underline">
            Create group
          </Link>
          <Link href="/groups/join" className="font-medium underline">
            Join with code
          </Link>
        </div>
      </section>
    );
  }

  const service = new GroupContestService(supabase);
  const contests = await service.listContests(activeGroupId);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Active contests</h1>
      <p className="text-sm text-muted-foreground">
        Showing contests for your active group. Each contest has its own leaderboard — totals never
        merge across contests.
      </p>
      <p className="text-sm">
        <Link href={`/groups/${activeGroupId}`} className="font-medium underline">
          Group home
        </Link>
      </p>
      <ul className="space-y-2">
        {contests.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <Link href={contestPrimaryLink(c)} className="font-medium underline">
              {c.name}
            </Link>
            <ContestFormatBadge formatLabel={c.format_label} />
            <ContestStateBadge state={c.state} />
          </li>
        ))}
        {contests.length === 0 ? (
          <li className="text-sm text-muted-foreground">No contests yet for this group.</li>
        ) : null}
      </ul>
    </section>
  );
}
