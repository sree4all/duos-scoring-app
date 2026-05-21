import { redirect } from "next/navigation";
import { isGroupCreationDisabled } from "@/lib/server/world-cup/flags";
import { getDefaultGroupId } from "@/lib/server/world-cup/flags";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export default function NewGroupPage() {
  if (isGroupCreationDisabled()) {
    const gid = getDefaultGroupId();
    redirect(gid ? `/groups/join` : "/groups/join");
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create a group</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You will become the group owner and receive an invite code to share.
        </p>
      </header>
      <CreateGroupForm />
    </section>
  );
}
