"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";

const CSV_FIELDS = [
  { name: "teams", label: "teams.csv", accept: ".csv" },
  { name: "cities", label: "host_cities.csv", accept: ".csv" },
  { name: "stages", label: "tournament_stages.csv", accept: ".csv" },
  { name: "matches", label: "matches.csv", accept: ".csv" },
] as const;

export function WorldCupImportPanel({
  groupId,
  contestId,
}: {
  groupId: string;
  contestId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const form = formRef.current;
    if (!form) {
      setPending(false);
      return;
    }

    const formData = new FormData(form);
    formData.set("contestId", contestId);

    try {
      const res = await fetch(`/api/groups/${groupId}/world-cup/import`, {
        method: "POST",
        body: formData,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : worldCupCopy.errors.importFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={runImport} className="space-y-4 rounded-lg border p-4">
      <h2 className="font-medium">Load match schedule</h2>
      <p className="text-sm text-muted-foreground">
        Download the Kaggle dataset, then upload all four CSV files here. (On Vercel, files in{" "}
        <code className="text-xs">data/worldcup-2026/</code> on your laptop are not on the server.)
      </p>
      <ul className="space-y-3">
        {CSV_FIELDS.map(({ name, label }) => (
          <li key={name}>
            <label className="block text-sm font-medium" htmlFor={`wc-csv-${name}`}>
              {label}
            </label>
            <input
              id={`wc-csv-${name}`}
              name={name}
              type="file"
              accept=".csv,text/csv"
              required
              className="mt-1 block w-full text-sm"
              disabled={pending}
            />
          </li>
        ))}
      </ul>
      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Import schedule"}
      </Button>
      {message ? <p className="text-sm text-status-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
