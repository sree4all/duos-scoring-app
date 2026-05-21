import type { GroupMembership } from "@/lib/domain/groups/types";

export function isOwner(membership: Pick<GroupMembership, "isOwner">): boolean {
  return membership.isOwner;
}

export function isScorer(membership: Pick<GroupMembership, "isScorer">): boolean {
  return membership.isScorer;
}

export function canManageContests(membership: Pick<GroupMembership, "isOwner">): boolean {
  return membership.isOwner;
}

export function canRecordRummyHand(
  membership: Pick<GroupMembership, "isOwner" | "isScorer">,
): boolean {
  return membership.isOwner || membership.isScorer;
}
