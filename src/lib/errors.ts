/**
 * Error hygiene: log the full error (with a context tag) server-side, and
 * hand the client a message that leaks nothing about internals.
 *
 * Anything a user genuinely needs to see — "that host isn't reachable",
 * "run a growth analysis first" — is thrown as a `SafeError`, whose message
 * is allowed through verbatim. Everything else (Prisma errors, Anthropic
 * API errors, Zod failures, network stack traces) is logged and replaced
 * with a generic fallback.
 */

/** Its `message` is safe to show to end users. */
export class SafeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeError";
  }
}

export function logError(context: string, error: unknown): void {
  const detail =
    error instanceof Error ? error.stack ?? `${error.name}: ${error.message}` : String(error);
  // Single structured line per failure — full detail stays on the server.
  console.error(`[${context}] ${detail}`);
}

/**
 * Log `error` under `context`, then return a user-safe string: the original
 * message only if it was a `SafeError`, otherwise `fallback`.
 */
export function toUserMessage(
  context: string,
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  logError(context, error);
  return error instanceof SafeError ? error.message : fallback;
}
