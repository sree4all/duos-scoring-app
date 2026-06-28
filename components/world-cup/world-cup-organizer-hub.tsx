"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function WorldCupOrganizerHub({
  groupId,
  contestId,
  contestName,
  contestState,
  linkedEvents,
  groupStageRevealed,
}: {
  groupId: string;
  contestId: string;
  contestName: string;
  contestState: string;
  linkedEvents: number;
  groupStageRevealed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = `contestId=${contestId}`;

  async function publishContest() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/contests/configuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          contestId,
          hasEvents: true,
          hasScoringPreset: true,
          hasValidLockPolicy: true,
        }),
      });
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (!res.ok) throw new Error(data.error ?? data.errors?.join(" ") ?? "Publish failed");
      setMessage("Contest is live for your group.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border p-4">
        <h2 className="font-medium">{contestName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: <span className="font-medium text-foreground">{contestState}</span>
          {" · "}
          {linkedEvents} matches linked
        </p>
        {contestState === "draft" ? (
          <Button type="button" className="mt-3" disabled={pending} onClick={publishContest}>
            {pending ? "Publishing…" : "Publish contest"}
          </Button>
        ) : (
          <p className="mt-2 text-sm text-status-success">Published — members can see this contest.</p>
        )}
      </div>

      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>
          {linkedEvents > 0 ? (
            <span className="text-status-success">Schedule imported ({linkedEvents} matches)</span>
          ) : (
            <Link
              href={`/groups/${groupId}/world-cup/import?${q}`}
              className="font-medium underline"
            >
              Import schedule (CSV upload)
            </Link>
          )}
        </li>
        <li>
          {groupStageRevealed ? (
            <span className="text-status-success">Group Stage is open for predictions</span>
          ) : (
            <Link
              href={`/groups/${groupId}/world-cup/stages?${q}`}
              className="font-medium underline"
            >
              Open rounds — reveal Group Stage
            </Link>
          )}
        </li>
        <li>
          <Link href={`/contests/${contestId}/matches`} className="font-medium underline">
            Preview match list
          </Link>
          {!groupStageRevealed ? (
            <span className="text-muted-foreground">
              {" "}
              (you see all matches; players only see revealed rounds)
            </span>
          ) : null}
        </li>
      </ol>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/groups/${groupId}/world-cup/import?${q}`}
          className="font-medium underline"
        >
          Import / re-import
        </Link>
        <Link
          href={`/groups/${groupId}/world-cup/stages?${q}`}
          className="font-medium underline"
        >
          Rounds &amp; points
        </Link>
        <Link href={`/contests/${contestId}/advanced-predictions`} className="font-medium underline">
          Bracket picks &amp; scoring
        </Link>
        <Link href={`/groups/${groupId}/settings`} className="font-medium underline">
          Invite code
        </Link>
        <Link href={`/groups/${groupId}`} className="font-medium underline">
          Group home
        </Link>
      </div>

      {message ? <p className="text-sm text-status-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
