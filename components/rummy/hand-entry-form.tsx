"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RummyHandPlayerInput } from "@/lib/domain/rummy/types";

export function HandEntryForm({
  groupId,
  contestId,
  participantIds,
}: {
  groupId: string;
  contestId: string;
  participantIds: string[];
}) {
  const [winnerId, setWinnerId] = useState(participantIds[0] ?? "");
  const [players, setPlayers] = useState<RummyHandPlayerInput[]>(
    participantIds.map((id) => ({ participantId: id, dropType: "none", unmeldedPoints: 0 })),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/rummy/hands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          winnerParticipantId: winnerId,
          players,
        }),
      });
      const data = (await res.json()) as { error?: string; handNo?: number };
      if (!res.ok) throw new Error(data.error ?? "Failed to record hand");
      setMessage(`Hand ${data.handNo} recorded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <label className="text-sm font-medium">Winner</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={winnerId}
          onChange={(e) => setWinnerId(e.target.value)}
        >
          {participantIds.map((id) => (
            <option key={id} value={id}>
              {id.slice(0, 8)}…
            </option>
          ))}
        </select>
      </div>
      {players.map((p, index) => (
        <div key={p.participantId} className="rounded border p-3 text-sm">
          <p className="font-mono">{p.participantId.slice(0, 8)}…</p>
          <select
            className="mt-2 w-full rounded-md border px-2 py-1"
            value={p.dropType ?? "none"}
            onChange={(e) => {
              const next = [...players];
              next[index] = {
                ...p,
                dropType: e.target.value as RummyHandPlayerInput["dropType"],
              };
              setPlayers(next);
            }}
          >
            <option value="none">Played</option>
            <option value="first">First drop</option>
            <option value="middle">Middle drop</option>
            <option value="full_count">Full count</option>
          </select>
          {(p.dropType ?? "none") === "none" ? (
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-md border px-2 py-1"
              value={p.unmeldedPoints ?? 0}
              onChange={(e) => {
                const next = [...players];
                next[index] = { ...p, unmeldedPoints: Number(e.target.value) };
                setPlayers(next);
              }}
            />
          ) : null}
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        Record hand
      </Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
