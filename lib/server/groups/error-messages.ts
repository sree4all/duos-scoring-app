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
    return "Could not create the group (permissions). Ensure group migrations are applied, then try again.";
  }
  if (process.env.NODE_ENV === "development" && message) {
    return message;
  }

  return "Something went wrong. Please try again.";
}
