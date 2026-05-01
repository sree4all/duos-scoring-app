export type UserRole = "admin" | "participant";

export function requireAdmin(role: UserRole) {
  if (role !== "admin") {
    throw new Error("Admin permissions required");
  }
}

export function requireParticipant(role: UserRole) {
  if (role !== "participant") {
    throw new Error("Participant permissions required");
  }
}

export function canAccessParticipantResource(actorId: string, ownerId: string) {
  return actorId === ownerId;
}
