import { CreateGroupForm } from "@/components/groups/create-group-form";

export default function NewGroupPage() {
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
