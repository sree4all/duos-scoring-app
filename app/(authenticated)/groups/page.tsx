import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { GroupRepository } from "@/lib/server/groups/repository";
import {
  getDefaultGroupId,
  isGroupCreationDisabled,
} from "@/lib/server/world-cup/flags";

export default async function GroupsHomePage() {
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  const privatePilot = isGroupCreationDisabled();

  if (activeGroupId) {
    redirect(`/groups/${activeGroupId}`);
  }

  const repo = new GroupRepository(supabase);
  const groups = await repo.listActiveGroupsForUser(user.id);

  if (groups.length === 1) {
    redirect(`/groups/${groups[0]!.id}`);
  }

  if (privatePilot && groups.length > 0) {
    redirect(`/groups/${groups[0]!.id}`);
  }

  const defaultGroupId = getDefaultGroupId();
  if (privatePilot && groups.length === 0 && defaultGroupId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Join your league</h1>
        <p className="text-sm text-muted-foreground">
          Enter the invite code from your organizer to start making World Cup picks.
        </p>
        <Link href="/groups/join" className="text-sm font-medium underline">
          Join with invite code
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your groups</h1>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {privatePilot
            ? "Join with the invite code from your organizer."
            : "Create a group or join with an invite code to get started."}
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="text-primary underline">
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        {!privatePilot ? (
          <Link href="/groups/new" className="text-sm font-medium underline">
            Create group
          </Link>
        ) : null}
        <Link href="/groups/join" className="text-sm font-medium underline">
          Join with code
        </Link>
      </div>
    </div>
  );
}
