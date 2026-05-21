import { redirect } from "next/navigation";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

type PageProps = { searchParams: Promise<{ next?: string }> };

export default async function JoinGroupPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  if (isWorldCupPrivateMode() && !next) {
    redirect("/welcome");
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Join your league</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {next
            ? "You need to join this private group before you can view predictions and standings."
            : "Enter the invite code shared by your group organizer."}
        </p>
      </header>
      <JoinGroupForm redirectAfterJoin={next} />
    </section>
  );
}
