"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function JoinGroupForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = (await res.json()) as { error?: string; groupId?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to join group");
      router.push(data.groupId ? `/groups/${data.groupId}` : "/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="invite-code" className="text-sm font-medium">
          Invite code
        </label>
        <input
          id="invite-code"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 uppercase"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          required
          maxLength={12}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join group"}
      </Button>
    </form>
  );
}
