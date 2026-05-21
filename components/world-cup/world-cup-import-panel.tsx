"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";

export function WorldCupImportPanel({
  groupId,
  contestId,
}: {
  groupId: string;
  contestId: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/world-cup/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId }),
      });
      const data = (await res.json()) as {
        error?: string;
        summary?: { matchesCreated: number; matchesUpdated: number; eventsLinked: number };
      };
      if (!res.ok) throw new Error(data.error ?? worldCupCopy.errors.importFailed);
      const s = data.summary;
      setMessage(
        s
          ? `Done! ${s.matchesCreated} new matches, ${s.matchesUpdated} updated, ${s.eventsLinked} events linked.`
          : "Import finished.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : worldCupCopy.errors.importFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Load match schedule</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Put CSV files in <code className="text-xs">data/worldcup-2026/</code> first, then import.
      </p>
      <Button type="button" className="mt-3" disabled={pending} onClick={runImport}>
        {pending ? "Importing…" : "Import schedule"}
      </Button>
      {message ? <p className="mt-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
