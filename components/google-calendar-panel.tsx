"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  saveGoogleCalendarSettingsPatch,
  disconnectGoogleCalendar,
  syncGoogleCalendarForMyVaultNow,
} from "@/lib/calendar-actions";

type Cal = { id: string; summary: string; primary: boolean };

const DEFAULT_TZ = "America/Los_Angeles";

function timeZoneOptions(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [DEFAULT_TZ, "America/New_York", "America/Chicago", "UTC"];
  }
}

export function GoogleCalendarPanel({
  connected,
  calendarId,
  timezone,
}: {
  connected: boolean;
  calendarId: string;
  timezone: string;
}) {
  const search = useSearchParams();
  const [calendars, setCalendars] = useState<Cal[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();
  const [saving, startSave] = useTransition();
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    calendarId || "primary",
  );
  const [selectedTimezone, setSelectedTimezone] = useState(
    timezone || DEFAULT_TZ,
  );

  useEffect(() => {
    setSelectedCalendarId(calendarId || "primary");
    setSelectedTimezone(timezone || DEFAULT_TZ);
  }, [calendarId, timezone]);

  useEffect(() => {
    const err = search.get("error");
    const ok = search.get("connected");
    if (err) {
      toast.error(
        err === "no_refresh_token"
          ? "Google did not return a refresh token. Try again and make sure you check all access boxes."
          : `Could not connect: ${decodeURIComponent(err)}`,
      );
    } else if (ok === "1") {
      toast.success("Google Calendar connected.");
    }
  }, [search]);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    void fetch("/api/google-calendar/calendars")
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as {
          calendars?: Cal[];
          error?: string;
        };
        if (!r.ok) {
          throw new Error(body.error ?? "Couldn't list calendars");
        }
        return body;
      })
      .then((j) => {
        if (!cancelled) {
          setCalendars(j.calendars ?? []);
          setLoadErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "Couldn't load calendars");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [connected]);

  const tzList = timeZoneOptions();
  const tzValue = timezone || DEFAULT_TZ;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-sm border border-paper-line/60 bg-paper-panel/30 p-4 text-[14px] leading-relaxed text-ink-dim">
        <p>
          When this is on, The Blueprint adds a <strong className="text-ink/90">Field Notes</strong>{" "}
          line for each calendar event on <strong className="text-ink/90">that day</strong>.
          It runs automatically once each morning, and you can also pull in
          today&apos;s events with the button below. Each event is only added once per day.
        </p>
      </div>

      {!connected ? (
        <div>
          <a
            href="/api/google-calendar/auth"
            className="inline-block rounded-sm border border-brass bg-brass/10 px-4 py-2 text-[13px] text-brass transition hover:bg-brass/20"
          >
            Connect Google Calendar
          </a>
          <p className="mt-3 text-[12px] text-ink-mute">
            You&apos;ll sign in with Google and allow read-only access to your
            calendars. The Blueprint never changes your calendar.
          </p>
        </div>
      ) : (
        <>
          {loadErr && (
            <div className="rounded-sm border border-rust/40 bg-rust/5 px-3 py-2.5 text-[13px] leading-relaxed text-rust">
              <p>{loadErr}</p>
              {/expired|invalid_grant|re-connect/i.test(loadErr) ? (
                <p className="mt-2 text-[12px] text-ink-dim">
                  Use <strong className="text-ink/80">Disconnect</strong>, then{" "}
                  <strong className="text-ink/80">Re-connect Google</strong>.
                </p>
              ) : null}
            </div>
          )}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              startSave(() => {
                void (async () => {
                  const r = await saveGoogleCalendarSettingsPatch({
                    calendar_id: selectedCalendarId,
                    timezone: selectedTimezone,
                  });
                  if (!r.ok) {
                    toast.error(r.error);
                    return;
                  }
                  toast.success("Calendar settings saved.");
                })();
              });
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-ink-mute" htmlFor="calendar_id">
                Which calendar
              </label>
              <select
                id="calendar_id"
                name="calendar_id"
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="max-w-md rounded-sm border border-paper-line bg-paper-bg/60 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brass"
                required
              >
                {calendars.length === 0 ? (
                  <option value={calendarId || "primary"}>
                    {calendarId || "primary"}
                  </option>
                ) : (
                  calendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.primary ? "★ " : ""}
                      {c.summary}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-ink-mute" htmlFor="timezone">
                Your time zone (for &ldquo;today&rdquo;)
              </label>
              <select
                id="timezone"
                name="timezone"
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="max-w-md rounded-sm border border-paper-line bg-paper-bg/60 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brass"
                required
              >
                {tzList.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.24em]"
              >
                {saving ? "SAVING…" : "SAVE"}
              </button>
              <button
                type="button"
                disabled={syncing}
                onClick={() => {
                  startSync(() => {
                    void (async () => {
                      const r = await syncGoogleCalendarForMyVaultNow();
                      if (!r.ok) {
                        toast.error(r.error);
                        return;
                      }
                      toast.success(
                        r.imported === 0
                          ? "No new events to add (or nothing on today’s calendar)."
                          : `Added ${r.imported} to Field Notes.`,
                      );
                    })();
                  });
                }}
                className="rounded-sm border border-paper-line px-3 py-2 text-[12px] text-ink-mute transition hover:border-brass/40 hover:text-brass disabled:opacity-50"
              >
                {syncing ? "Working…" : "Pull in today’s events now"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 border-t border-paper-line/40 pt-6">
            <a
              href="/api/google-calendar/auth"
              className="text-[12px] text-brass underline-offset-2 hover:underline"
            >
              Re-connect Google
            </a>
            <form action={disconnectGoogleCalendar}>
              <button
                type="submit"
                className="text-[12px] text-ink-mute underline-offset-2 hover:text-rust hover:underline"
              >
                Disconnect Google Calendar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
