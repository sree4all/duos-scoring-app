import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { listGroupHistoryForUser } from "@/lib/server/groups/history-query";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";
import { HistoryList } from "@/components/world-cup/history-list";
import { worldCupCopy } from "@/lib/copy/world-cup";

export default async function ParticipantHistoryPage() {
  const { supabase, user } = await requireUser();

  if (!isGroupScopingEnabled()) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold sm:text-2xl">History</h1>
        <p className="text-sm text-muted-foreground">Group scoping is disabled.</p>
      </section>
    );
  }

  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold sm:text-2xl">{worldCupCopy.nav.myPoints}</h1>
        <p className="text-sm text-muted-foreground">
          {isWorldCupPrivateMode()
            ? "Sign in with the league link to see your points."
            : "Join or create a group to see your scoring history."}
        </p>
        <Link
          href={isWorldCupPrivateMode() ? "/join" : "/groups"}
          className="text-sm font-medium underline"
        >
          {isWorldCupPrivateMode() ? "Join the league" : "Go to groups"}
        </Link>
      </section>
    );
  }

  const items = await listGroupHistoryForUser(supabase, activeGroupId, user.id);

  const lines = items.map((item) => ({
    id: item.id,
    kind: item.kind,
    pointsDelta: item.pointsDelta,
    matchTitle: item.matchTitle,
    predictedWinner: item.predictedWinner,
    actualWinner: item.actualWinner,
    bonusQuestion: item.bonusQuestion,
    chosenAnswer: item.chosenAnswer,
    correctAnswer: item.correctAnswer,
    fallbackLabel: item.fallbackLabel,
    voided: Boolean(item.voided),
    provisional: Boolean(item.provisional),
  }));

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl">{worldCupCopy.nav.myPoints}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your point lines for this group — match picks and bonus answers with results.
        </p>
      </header>
      <HistoryList items={lines} />
    </section>
  );
}
