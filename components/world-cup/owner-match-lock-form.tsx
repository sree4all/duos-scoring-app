"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatEasternDateTime } from "@/lib/utils/eastern-time";

function toDatetimeLocalValue(isoUtc: string): string {
  const d = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}

export function OwnerMatchLockForm({
  groupId,
  contestId,
  eventId,
  lockAt,
}: {
  groupId: string;
  contestId: string;
  eventId: string;
  lockAt: string | null;
}) {
  const [value, setValue] = useState(lockAt ? toDatetimeLocalValue(lockAt) : "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveLock() {
    if (!value) {
      setError("Choose a lock time.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/contests/${contestId}/events/${eventId}/lock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockAt: datetimeLocalToIso(value) }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not update lock time");
      setMessage(`Predictions lock at ${formatEasternDateTime(datetimeLocalToIso(value))}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update lock time");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Pick lock time</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Members cannot save predictions after this time. By default, picks lock 30 minutes before
        kickoff (shown in Eastern Time on the schedule). You can set an earlier lock.
      </p>
      {lockAt ? (
        <p className="mt-2 text-sm">
          Current: {formatEasternDateTime(lockAt)}
        </p>
      ) : null}
      <label className="mt-3 block text-sm">
        <span className="text-muted-foreground">Lock at (your local time)</span>
        <input
          type="datetime-local"
          className="mt-1 w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
        />
      </label>
      <Button type="button" className="mt-3" disabled={pending} onClick={saveLock}>
        Save lock time
      </Button>
      {message ? <p className="mt-2 text-sm text-status-success">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
