# 2026-11-14 — Original publication handoff retry/no-drop contract

- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
- Original source writer: `powerhouse-content-loop`; original canonical obligations + Brain + Heartbeat stay authoritative.
- Observed production: 15 loops; 8 RED/AMBER; original Instagram 14 Nov open, unique source/media not supplied, provider readback missing, source receipt received by Brain but no provider post.
- Root: nullable PostgREST equality and silently ignored overdue source items; zero-row CAS not independently classified.
- Corrective: pure planner reports all due item destinations/reasons, original-null CAS `.is`, original current-row readback, same BRAIN incident/brain_records persistence, original agent skill tasks.
- Safety: sender and daily cron never disabled for recoverable problems; no new runner, no false green, preserve paid authorization, OAuth and provider media proof/face/duplicate gates.
- Tests: `tests/brain-original-no-silent-obligation-handoff-20261114.test.mjs`; `tests/brain-publication-obligation-recovery-handoff-20261031.test.mjs`.
- Release status: PROTECTED_CANDIDATE; actual production and next natural run evidence required for closure.
