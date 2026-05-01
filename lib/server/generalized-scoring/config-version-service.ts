export interface ConfigVersionSnapshot {
  contestId: string;
  versionNo: number;
  state: "draft" | "published" | "superseded";
  snapshot: Record<string, unknown>;
}

export async function createConfigVersionSnapshot(
  input: ConfigVersionSnapshot
) {
  return {
    ...input,
    createdAt: new Date().toISOString(),
  };
}
