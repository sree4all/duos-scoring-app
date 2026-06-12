import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryLineItem = {
  id: string;
  contestId: string;
  eventId: string | null;
  participantId: string;
  actionType: string;
  pointsDelta: number;
  reasonText: string | null;
  matchNumber: number | null;
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
    .from("contest_points_ledger")
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
  const matchNumberByEventId = new Map<string, number | null>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, voided, source_match_id")
      .in("id", eventIds);

    const matchIds = [
      ...new Set(
        (events ?? [])
          .map((ev) => ev.source_match_id as string | null)
          .filter(Boolean),
      ),
    ] as string[];

    const matchNumberById = new Map<string, number | null>();
    if (matchIds.length > 0) {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, match_number")
        .in("id", matchIds);
      for (const match of matches ?? []) {
        matchNumberById.set(
          match.id as string,
          (match.match_number as number | null) ?? null,
        );
      }
    }

    for (const ev of events ?? []) {
      const eventId = ev.id as string;
      voidedByEvent.set(eventId, Boolean(ev.voided));
      const matchId = ev.source_match_id as string | null;
      matchNumberByEventId.set(
        eventId,
        matchId ? (matchNumberById.get(matchId) ?? null) : null,
      );
    }
  }

  const rows = (ledger ?? []).map((row) => {
    const eventId = (row.event_id as string | null) ?? null;
    return {
      id: row.id as string,
      contestId: row.contest_id as string,
      eventId,
      participantId: row.participant_id as string,
      actionType: row.action_type as string,
      pointsDelta: Number(row.points_delta ?? 0),
      reasonText: (row.reason_text as string | null) ?? null,
      matchNumber: eventId ? (matchNumberByEventId.get(eventId) ?? null) : null,
      createdAt: row.created_at as string,
      voided: eventId ? voidedByEvent.get(eventId) : false,
      provisional: row.action_type === "provisional",
    };
  });

  return rows.sort((a, b) => {
    const matchDiff = (b.matchNumber ?? -1) - (a.matchNumber ?? -1);
    if (matchDiff !== 0) return matchDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
