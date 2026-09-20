# Development ledger — composio-oauth-immediate-resume-v1

- Date: 2026-09-20
- Gap: OAuth success only changed setup status; publication waited for hourly scheduler/manual follow-up.
- Fix: bounded 5-second polling, max 60 attempts, then one canonical publisher resume.
- Security: resume is available only through the admin Netlify service-token boundary.
- Safety: exact one ACTIVE Instagram account required; no direct provider bypass.
