import { writeAuditLog } from "./audit-log";

export interface OverrideInput {
  actorId: string;
  scope: string;
  reason: string;
}

export async function recordAdminOverride(input: OverrideInput) {
  if (!input.reason?.trim()) {
    throw new Error("Override requires a reason");
  }
  return writeAuditLog({
    actorId: input.actorId,
    action: "admin_override",
    reason: input.reason,
    metadata: { scope: input.scope },
  });
}
