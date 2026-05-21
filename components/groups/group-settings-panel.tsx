"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupDualFormatPanel } from "@/components/onboarding/group-dual-format-panel";

type Member = {
  userId: string;
  isOwner: boolean;
  isScorer: boolean;
};

export function GroupSettingsPanel({
  groupId,
  groupName,
  inviteCode,
  members,
  currentUserId,
  isOwner,
  worldCupPrivateMode = false,
}: {
  groupId: string;
  groupName: string;
  inviteCode: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  worldCupPrivateMode?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(inviteCode);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function patchMembers(body: Record<string, unknown>) {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string; inviteCode?: string };
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  async function regenerateInvite() {
    try {
      const data = await patchMembers({ action: "regenerate_invite" });
      if (data.inviteCode) setCode(data.inviteCode);
      setMessage("Invite code regenerated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function leaveGroup() {
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to leave");
      router.push("/groups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{groupName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {worldCupPrivateMode ? "Organizer settings" : "Group settings"}
        </p>
      </header>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Invite code</p>
        <p className="mt-1 font-mono text-lg tracking-widest">{code}</p>
        {isOwner ? (
          <Button type="button" variant="secondary" className="mt-3" onClick={regenerateInvite}>
            Regenerate code
          </Button>
        ) : null}
      </div>

      {!worldCupPrivateMode ? <GroupDualFormatPanel isOwner={isOwner} /> : null}

      {isOwner ? (
        <p className="flex flex-wrap gap-3 text-sm">
          <Link href={`/groups/${groupId}/contests/new`} className="font-medium underline">
            {worldCupPrivateMode ? "Manage World Cup contest" : "Manage contests"}
          </Link>
          <Link href={`/groups/${groupId}`} className="font-medium underline">
            Group home
          </Link>
          {worldCupPrivateMode ? (
            <Link
              href={`/groups/${groupId}/world-cup/import`}
              className="font-medium underline"
            >
              Import schedule
            </Link>
          ) : null}
        </p>
      ) : (
        <p>
          <Link href={`/groups/${groupId}`} className="font-medium underline">
            Back to home
          </Link>
        </p>
      )}

      {isOwner ? (
        <ul className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium">Members</p>
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono">{m.userId.slice(0, 8)}…</span>
              {m.isOwner ? <span className="text-muted-foreground">owner</span> : null}
              {!worldCupPrivateMode && m.isScorer ? (
                <span className="text-muted-foreground">scorer</span>
              ) : null}
              {isOwner && !worldCupPrivateMode && m.userId !== currentUserId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await patchMembers({
                        action: "set_scorer",
                        userId: m.userId,
                        isScorer: !m.isScorer,
                      });
                      router.refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed");
                    }
                  }}
                >
                  {m.isScorer ? "Revoke scorer" : "Make scorer"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!worldCupPrivateMode ? (
        <Button type="button" variant="outline" onClick={leaveGroup}>
          Leave group
        </Button>
      ) : null}

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
