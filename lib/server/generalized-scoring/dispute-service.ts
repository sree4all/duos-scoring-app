export const DISPUTE_RESOLUTION_SLA_MS = 48 * 60 * 60 * 1000;

export type DisputeStatus = "received" | "under_review" | "pending_final_approval" | "resolved";

export interface DisputeCase {
  id: string;
  openedAt: number;
  status: DisputeStatus;
  reviewerApproved: boolean;
  finalApproverApproved: boolean;
}

export function isPastDisputeSLA(openedAt: number, nowMs: number) {
  return nowMs - openedAt > DISPUTE_RESOLUTION_SLA_MS;
}

export function evaluateDisputeResolution(dispute: DisputeCase): "approved" | "pending" | "blocked" {
  if (!dispute.reviewerApproved) return "pending";
  if (!dispute.finalApproverApproved) return "pending";
  return "approved";
}
