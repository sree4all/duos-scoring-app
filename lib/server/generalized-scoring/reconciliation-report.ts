export interface LedgerLikeEntry {
  participantId: string;
  pointsDelta: number;
}

export function sumLedgerByParticipant(entries: LedgerLikeEntry[]) {
  const map = new Map<string, number>();
  for (const row of entries) {
    map.set(row.participantId, (map.get(row.participantId) ?? 0) + row.pointsDelta);
  }
  return Object.fromEntries(map);
}

export function buildReconciliationSummary(
  ledgerTotals: Record<string, number>,
  displayedTotals: Record<string, number>
) {
  const mismatches: string[] = [];
  const keys = new Set([...Object.keys(ledgerTotals), ...Object.keys(displayedTotals)]);
  for (const key of keys) {
    const a = ledgerTotals[key] ?? 0;
    const b = displayedTotals[key] ?? 0;
    if (a !== b) mismatches.push(key);
  }
  return { ok: mismatches.length === 0, mismatches };
}
