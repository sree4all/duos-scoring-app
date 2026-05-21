export function isWorldCupImportEnabled(): boolean {
  return process.env.WORLD_CUP_IMPORT_ENABLED !== "false";
}

export function isWorldCupPrivateMode(): boolean {
  return process.env.WORLD_CUP_PRIVATE_MODE === "true";
}

export function getDefaultGroupId(): string | null {
  const id = process.env.DEFAULT_GROUP_ID?.trim();
  return id || null;
}

export function getDefaultContestId(): string | null {
  const id = process.env.DEFAULT_CONTEST_ID?.trim();
  return id || null;
}

/** Invite code for one-tap league join (private pilot). */
export function getDefaultInviteCode(): string | null {
  const code = process.env.DEFAULT_INVITE_CODE?.trim();
  return code || null;
}

/** Pilot shell: single group, World Cup only, no self-serve group creation. */
export function isGroupCreationDisabled(): boolean {
  return isWorldCupPrivateMode();
}
