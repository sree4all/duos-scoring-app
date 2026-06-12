function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function mapGroupError(error: unknown): string {
  const message = errorMessage(error);

  if (message.includes("Invalid or expired invite")) {
    return "That invite code is not valid. Ask your group owner for the current code.";
  }
  if (message.includes("Only group owners")) {
    return "Only group owners can perform this action.";
  }
  if (message.includes("last owner")) {
    return "This group must keep at least one owner. Promote another member first.";
  }
  if (message.includes("Not authenticated")) {
    return "Please sign in to continue.";
  }
  if (message.includes("row-level security") || message.includes("42501")) {
    if (message.includes("bonus_prompt")) {
      return "You do not have permission to manage bonus questions for this match. Confirm you are the group owner and migrations through 202605220002 are applied.";
    }
    if (
      message.includes("points_ledger") ||
      message.includes("profiles") ||
      message.includes("matches")
    ) {
      return "Could not apply match scoring (permissions). Confirm you are the group owner, the match is linked to this contest, and migration 0026_group_owner_match_scoring_rls is applied.";
    }
    return "Could not create the group (permissions). Ensure group migrations are applied, then try again.";
  }
  if (
    message.includes("PGRST204") ||
    message.includes("correct_points") ||
    message.includes("incorrect_penalty")
  ) {
    return "Bonus questions require a database update. Run Supabase migrations through 202605220001 (match bonus prompts), then try again.";
  }
  if (process.env.NODE_ENV === "development" && message) {
    return message;
  }

  return "Something went wrong. Please try again.";
}
