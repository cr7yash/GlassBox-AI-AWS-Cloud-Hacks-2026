# Changelog — 2026-04-19

## UX: Critical Alert & Postmortem Flow (user-initiated instead of auto)

### Changed
- `critical-alert-toast.tsx` — Removed auto-play audio and auto-dismiss timer. Toast now persists until user dismisses it. Added "View Report" button (opens postmortem modal) and "Listen" button (plays Polly TTS on demand).
- `postmortem-modal.tsx` — Removed auto-open behavior. Modal is now controlled via `open`/`onOpenChange` props from the parent dashboard. Added a "Listen" button in the modal header for playing the matching Polly audio narration.
- `safety-quadrant.tsx` — Added "Post-Incident Report (N)" button in the quadrant header bar, visible when postmortems exist. Gives users a persistent, non-intrusive way to access reports.
- `dashboard.tsx` — Added `postmortemOpen` state. Wired toast "View Report" → opens modal, quadrant button → opens modal. Passes `alerts` array to `PostmortemModal` so it can resolve matching audio URLs.

### Why
Previous flow auto-opened the postmortem modal and auto-played TTS on every critical event, continuously stealing user focus. The new flow shows a non-blocking toast and lets the user decide when to read the report or listen to the narration.
