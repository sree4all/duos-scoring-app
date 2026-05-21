import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { resolveActiveGroupId } from "@/lib/server/groups/active-context";
import { listGroupHistoryForUser } from "@/lib/server/groups/history-query";
import { projectLedgerLines } from "@/lib/server/generalized-scoring/scoring-projection-service";
import { isGroupScopingEnabled } from "@/lib/server/groups/flags";
import { isWorldCupPrivateMode } from "@/lib/server/world-cup/flags";

export default async function ParticipantHistoryPage() {
  const { supabase, user } = await requireUser();

  if (!isGroupScopingEnabled()) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">Group scoping is disabled.</p>
      </main>
    );
  }

  const activeGroupId = await resolveActiveGroupId(supabase, user.id);
  if (!activeGroupId) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          {isWorldCupPrivateMode()
            ? "Join with your invite code to see your points."
            : "Join or create a group to see your scoring history."}
        </p>
        <Link
          href={isWorldCupPrivateMode() ? "/groups/join" : "/groups"}
          className="text-sm font-medium underline"
        >
          {isWorldCupPrivateMode() ? "Join with code" : "Go to groups"}
        </Link>
      </main>
    );
  }

  const items = await listGroupHistoryForUser(supabase, activeGroupId, user.id);
  const projected = projectLedgerLines(
    items.map((item) => ({
      actionType: item.actionType,
      pointsDelta: item.pointsDelta,
      reasonText: item.reasonText,
    })),
  );

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">History</h1>
      <p className="text-sm text-muted-foreground">
        Itemized lines for your active group. Voided events show a badge when linked.
      </p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{projected[index]?.label ?? item.actionType}</span>
              <span>{item.pointsDelta >= 0 ? "+" : ""}{item.pointsDelta} pts</span>
              {item.voided ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                  voided
                </span>
              ) : null}
              {item.provisional ? (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">provisional</span>
              ) : null}
            </div>
            <p className="mt-1 text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No history yet for this group.</li>
        ) : null}
      </ul>
    </main>
  );
}
