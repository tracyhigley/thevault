import { z } from "zod";

/**
 * Turns a ZodError into a short, human-readable message safe to surface in a
 * toast. Server Actions scrub thrown error messages in production builds, so
 * without this, validation failures (e.g. "meta too long") show up to the
 * user as an opaque "An error occurred in the Server Components render."
 * Returns null if `error` isn't a ZodError.
 */
export function describeZodError(error: unknown): string | null {
  if (!(error instanceof z.ZodError)) return null;
  return error.issues
    .map((issue) => {
      const field = issue.path.length ? issue.path.join(".") : "value";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}
