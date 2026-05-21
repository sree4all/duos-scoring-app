export function mapGroupError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

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

  return "Something went wrong. Please try again.";
}
