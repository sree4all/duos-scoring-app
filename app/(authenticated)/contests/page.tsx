import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { redirect } from "next/navigation";
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

  if (isWorldCupPrivateMode() && activeGroupId) {
    redirect(`/groups/${activeGroupId}`);
  }

  if (!activeGroupId) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Active contests</h1>
        <p className="text-sm text-muted-foreground">
          {isWorldCupPrivateMode()
            ? "Join with your invite code to see World Cup picks."
            : "Create or join a private group to see contests for your team."}
        </p>
        <div className="flex gap-3">
          {!isWorldCupPrivateMode() ? (
            <Link href="/groups/new" className="font-medium underline">
              Create group
            </Link>
          ) : null}
          <Link href="/groups/join" className="font-medium underline">
            Join with invite code
          </Link>
        </div>
      </section>
    );
  }

  const service = new GroupContestService(supabase);
  const contests = await service.listContests(activeGroupId);
  const visible = isWorldCupPrivateMode()
    ? contests.filter(
        (c) =>
          c.format_label !== "rummy_points" &&
          ((c.name ?? "").toLowerCase().includes("world cup") ||
            (c.name ?? "").toLowerCase().includes("fifa") ||
            c.format_label === "prediction"),
      )
    : contests;

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
        {visible.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <Link href={contestPrimaryLink(c)} className="font-medium underline">
              {c.name}
            </Link>
            <ContestFormatBadge formatLabel={c.format_label} />
            <ContestStateBadge state={c.state} />
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="text-sm text-muted-foreground">No contests yet for this group.</li>
        ) : null}
      </ul>
    </section>
  );
}
