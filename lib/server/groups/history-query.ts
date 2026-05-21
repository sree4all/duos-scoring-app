import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryLineItem = {
  id: string;
  contestId: string;
  eventId: string | null;
  participantId: string;
  actionType: string;
  pointsDelta: number;
  reasonText: string | null;
  createdAt: string;
  voided?: boolean;
  provisional?: boolean;
};

export async function listGroupHistoryForUser(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  limit = 100,
): Promise<HistoryLineItem[]> {
  const { data: contests, error: cErr } = await supabase
    .from("contests")
    .select("id")
    .eq("group_id", groupId);

  if (cErr) throw cErr;
  const contestIds = (contests ?? []).map((c) => c.id as string);
  if (contestIds.length === 0) return [];

  const { data: ledger, error: lErr } = await supabase
    .from("points_ledger")
    .select(
      "id, contest_id, event_id, participant_id, action_type, points_delta, reason_text, created_at",
    )
    .in("contest_id", contestIds)
    .eq("participant_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (lErr) throw lErr;

  const eventIds = [
    ...new Set((ledger ?? []).map((r) => r.event_id as string | null).filter(Boolean)),
  ] as string[];

  const voidedByEvent = new Map<string, boolean>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, voided")
      .in("id", eventIds);
    for (const ev of events ?? []) {
      voidedByEvent.set(ev.id as string, Boolean(ev.voided));
    }
  }

  return (ledger ?? []).map((row) => ({
    id: row.id as string,
    contestId: row.contest_id as string,
    eventId: (row.event_id as string | null) ?? null,
    participantId: row.participant_id as string,
    actionType: row.action_type as string,
    pointsDelta: Number(row.points_delta ?? 0),
    reasonText: (row.reason_text as string | null) ?? null,
    createdAt: row.created_at as string,
    voided: row.event_id ? voidedByEvent.get(row.event_id as string) : false,
    provisional: row.action_type === "provisional",
  }));
}
