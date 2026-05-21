import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { GroupRepository } from "@/lib/server/groups/repository";
import { isGroupCreationDisabled } from "@/lib/server/world-cup/flags";

export default async function GroupsHomePage() {
  const { supabase, user } = await requireUser();
  const privatePilot = isGroupCreationDisabled();
  const repo = new GroupRepository(supabase);
  const groups = await repo.listActiveGroupsForUser(user.id);

  if (groups.length > 0) {
    const activeGroupId = await resolveActiveGroupId(supabase, user.id);
    const target =
      activeGroupId && groups.some((g) => g.id === activeGroupId)
        ? activeGroupId
        : groups[0]!.id;
    redirect(`/groups/${target}`);
  }

  if (privatePilot) {
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
      <p className="text-sm text-muted-foreground">
        Create a group or join with an invite code to get started.
      </p>
      <div className="flex gap-3">
        <Link href="/groups/new" className="text-sm font-medium underline">
          Create group
        </Link>
        <Link href="/groups/join" className="text-sm font-medium underline">
          Join with code
        </Link>
      </div>
    </div>
  );
}
