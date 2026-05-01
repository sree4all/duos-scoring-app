const FRIENDLY_MESSAGES: Record<string, string> = {
  MISSING_EVENTS: "Add at least one event before publishing.",
  MISSING_SCORING_PRESET: "Select a scoring preset to continue.",
  INVALID_LOCK_POLICY: "Fix lock settings before publishing.",
};

export function toAdminFriendlyMessage(code: string) {
  return FRIENDLY_MESSAGES[code] ?? "Please review the form and try again.";
}
