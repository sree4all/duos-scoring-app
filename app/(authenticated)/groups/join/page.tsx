import { JoinGroupForm } from "@/components/groups/join-group-form";

export default function JoinGroupPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Join a group</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the invite code shared by your group owner.
        </p>
      </header>
      <JoinGroupForm />
    </section>
  );
}
