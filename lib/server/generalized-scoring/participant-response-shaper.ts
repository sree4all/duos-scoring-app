type ParticipantView = Record<string, unknown>;

export function toParticipantSafeResponse(payload: ParticipantView) {
  const rest = { ...(payload as Record<string, unknown>) };
  delete rest.audit;
  delete rest.internal;
  return rest;
}
