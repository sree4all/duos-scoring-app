export type GroupStatus = "active" | "archived";

export type Group = {
  id: string;
  name: string;
  slug: string | null;
  status: GroupStatus;
  currentInviteCode: string;
  inviteCodeRotatedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupMembership = {
  id: string;
  groupId: string;
  userId: string;
  isOwner: boolean;
  isScorer: boolean;
  joinedAt: string;
  removedAt: string | null;
};

export type InviteCodeHistoryEntry = {
  id: string;
  groupId: string;
  inviteCode: string;
  revokedAt: string;
};

export type ActiveGroupContext = {
  groupId: string;
  userId: string;
};
