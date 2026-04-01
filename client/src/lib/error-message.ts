export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    const rawMessage = error.message.trim();

    if (rawMessage.toLowerCase().includes("failed to fetch")) {
      return "The request could not reach the server. Check your network connection and backend availability.";
    }

    return rawMessage;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}
