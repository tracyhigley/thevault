# Apple Shortcut: Add to Field Notes

A 30-second setup for the Action Button on iPhone.

## Once

1. Open **Shortcuts** app → **+** → name it `Add to Field Notes`.
2. Add these actions in order:
   1. **Dictate Text** — language: English (US). Stop on tap.
   2. **Get Contents of URL**
      - URL: `https://YOUR-DOMAIN.app/api/capture`
      - Method: `POST`
      - Headers:
         - `Authorization` → `Bearer YOUR_CAPTURE_TOKEN`
         - `Content-Type` → `application/json`
      - Request Body → JSON:
         - `text` → (Magic Variable: Dictated Text)
         - `source` → `shortcut`
         - `userId` → `YOUR_USER_ID`
   3. **Show Notification** — text: `Added.`
3. Save.
4. **Settings → Action Button → Shortcut → Add to Field Notes.**

## Daily

Press the Action Button. Talk. Done. Item lands in **Field Notes**.

## Variables to fill in

- `YOUR-DOMAIN.app` — Vercel domain.
- `YOUR_CAPTURE_TOKEN` — copy **Bearer token** from **Settings** (generated there and saved to the database). Optionally, self‑hosted stacks can still set `CAPTURE_TOKEN` in env as a legacy shared secret instead.
- `YOUR_USER_ID` — your `auth.uid` after signing in once. (Run a one-liner against Supabase to grab it, or copy from Settings → Connect.)

## Siri variant

Same Shortcut works with “Hey Siri, add to field notes” — Siri runs the Shortcut.
