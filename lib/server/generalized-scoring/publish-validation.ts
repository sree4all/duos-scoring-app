export interface PublishValidationInput {
  hasEvents: boolean;
  hasScoringPreset: boolean;
  hasValidLockPolicy: boolean;
}

export interface PublishValidationResult {
  ok: boolean;
  errors: string[];
}

export function validatePublishReadiness(
  input: PublishValidationInput
): PublishValidationResult {
  const errors: string[] = [];
  if (!input.hasEvents) errors.push("Add at least one event");
  if (!input.hasScoringPreset) errors.push("Select a scoring preset");
  if (!input.hasValidLockPolicy) errors.push("Fix lock policy configuration");

  return {
    ok: errors.length === 0,
    errors,
  };
}
