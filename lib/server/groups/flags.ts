export function isGroupScopingEnabled(): boolean {
  return process.env.GROUP_SCOPING_ENABLED !== "false";
}

export function isGroupPredictionEnabled(): boolean {
  return process.env.GROUP_PREDICTION_ENABLED !== "false";
}

export function isGroupRummyEnabled(): boolean {
  return process.env.GROUP_RUMMY_ENABLED !== "false";
}
