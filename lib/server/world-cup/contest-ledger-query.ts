import type { SupabaseClient } from "@supabase/supabase-js";

const LEDGER_PAGE_SIZE = 1000;

export type ContestLedgerRow = {
  participantId: string;
  pointsDelta: number;
};

/** Fetch all contest ledger rows (PostgREST defaults to 1000 rows per request). */
export async function fetchAllContestLedgerRows(
  supabase: SupabaseClient,
  contestId: string,
): Promise<ContestLedgerRow[]> {
  const rows: ContestLedgerRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contest_points_ledger")
      .select("participant_id, points_delta")
      .eq("contest_id", contestId)
      .order("id", { ascending: true })
      .range(from, from + LEDGER_PAGE_SIZE - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      rows.push({
        participantId: row.participant_id as string,
        pointsDelta: Number(row.points_delta ?? 0),
      });
    }

    if (data.length < LEDGER_PAGE_SIZE) break;
    from += LEDGER_PAGE_SIZE;
  }

  return rows;
}
