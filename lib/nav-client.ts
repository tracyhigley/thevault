"use client";

import { SKIP_FIELD_NOTES_LANDING_COOKIE } from "@/lib/nav-cookies";

/** Call before client navigations to `/` when Today is meant (nav, wizard exit). */
export function markPreferTodayOverDropLanding(): void {
  try {
    const maxAge = 60 * 60 * 12;
    document.cookie = `${SKIP_FIELD_NOTES_LANDING_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* private mode / disabled cookies */
  }
}
