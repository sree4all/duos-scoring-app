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
