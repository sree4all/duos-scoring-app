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

/** Odd-match auto bonus generation (feature 009). Opt-in until DB migration is applied. */
export function isWorldCupOddBonusEnabled(): boolean {
  return process.env.WORLD_CUP_ODD_BONUS_ENABLED === "true";
}

/** Matches with kickoff after this instant may receive auto odd bonuses. */
export function getWorldCupOddBonusEnabledAt(): Date {
  const raw = process.env.WORLD_CUP_ODD_BONUS_ENABLED_AT?.trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date("2026-07-05T00:00:00.000Z");
}
