"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OwnerEventResultsForm({
  groupId,
  contestId,
  matchId,
}: {
  groupId: string;
  contestId: string;
  matchId: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScoring() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/results`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        },
      );
      const data = (await res.json()) as { error?: string; ledgerRows?: number };
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setMessage(`Scoring applied (${data.ledgerRows ?? 0} ledger rows).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Official results</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Match must be completed in legacy data before scoring runs.
      </p>
      <Button type="button" className="mt-3" disabled={pending} onClick={runScoring}>
        Apply match scoring
      </Button>
      {message ? <p className="mt-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
