export interface LedgerEntryInput {
  contestId: string;
  participantId: string;
  actionType: string;
  pointsDelta: number;
  correlationId: string;
  reasonText?: string;
}

export async function appendLedgerEntry(entry: LedgerEntryInput) {
  // Placeholder append-only contract for future DB implementation.
  return {
    ...entry,
    createdAt: new Date().toISOString(),
  };
}
