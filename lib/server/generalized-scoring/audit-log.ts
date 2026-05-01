export interface AuditLogInput {
  actorId: string;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput) {
  // Placeholder for structured logging sink.
  return {
    ...input,
    timestamp: new Date().toISOString(),
  };
}
