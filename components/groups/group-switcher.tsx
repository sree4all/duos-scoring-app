"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
type GroupOption = { id: string; name: string };

export function GroupSwitcher({
  groups,
  activeGroupId,
  hideWhenSingle = false,
}: {
  groups: GroupOption[];
  activeGroupId: string | null;
  hideWhenSingle?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onChange(groupId: string) {
    setPending(true);
    try {
      const res = await fetch("/api/groups/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to switch group");
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (groups.length === 0) return null;
  if (hideWhenSingle && groups.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Group</span>
      <select
        className="neon-input h-9 py-1"
        value={activeGroupId ?? ""}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </label>
  );
}
