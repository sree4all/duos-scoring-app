"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { worldCupCopy } from "@/lib/copy/world-cup";
import { saveMatchPick } from "@/app/(authenticated)/contests/[contestId]/events/[eventId]/actions";

export function MatchPickForm({
  contestId,
  eventId,
  matchId,
  homeTeam,
  awayTeam,
  initialPick,
  locked,
}: {
  contestId: string;
  eventId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  initialPick: string | null;
  locked: boolean;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(initialPick ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    if (locked) {
      setError(worldCupCopy.errors.picksClosed);
      return;
    }
    if (!pick) return;
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveMatchPick(contestId, eventId, matchId, pick);
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage("Pick saved!");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Your pick</h2>
      <p className="mt-1 text-sm text-muted-foreground">Who will win?</p>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="winner"
            value={homeTeam}
            checked={pick === homeTeam}
            disabled={locked}
            onChange={() => setPick(homeTeam)}
          />
          {homeTeam}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="winner"
            value={awayTeam}
            checked={pick === awayTeam}
            disabled={locked}
            onChange={() => setPick(awayTeam)}
          />
          {awayTeam}
        </label>
      </div>
      {!locked ? (
        <Button type="button" className="mt-3" disabled={pending || !pick} onClick={save}>
          Save pick
        </Button>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{worldCupCopy.matchStatus.locked}</p>
      )}
      {message ? <p className="mt-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
