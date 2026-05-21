import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { GroupContestService } from "@/lib/server/groups/group-contest-service";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { requireGroupMembership } from "@/lib/server/groups/guards";

type PageProps = { params: Promise<{ contestId: string }> };

export default async function RummyHistoryPage({ params }: PageProps) {
  const { contestId } = await params;
  const { supabase, user } = await requireUser();
  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) notFound();

  await requireGroupMembership(supabase, activeGroupId, user.id);
  const contests = new GroupContestService(supabase);
  await contests.assertContestInGroup(contestId, activeGroupId);

  const { data: hands } = await supabase
    .from("rummy_hands")
    .select("id, hand_no, winner_participant_id, voided, correction_reason, created_at")
    .eq("contest_id", contestId)
    .order("hand_no", { ascending: true });

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Rummy hand history</h1>
      <ul className="space-y-2">
        {(hands ?? []).map((h) => (
          <li key={h.id as string} className="rounded-lg border p-3 text-sm">
            <span className="font-medium">Hand {h.hand_no as number}</span>
            {h.voided ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs">voided</span>
            ) : null}
            {h.correction_reason ? (
              <p className="mt-1 text-muted-foreground">Correction: {h.correction_reason as string}</p>
            ) : null}
          </li>
        ))}
        {(hands ?? []).length === 0 ? (
          <li className="text-muted-foreground">No hands recorded yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
