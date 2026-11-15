# Development ledger — original sales action reexecution isn't one immutable cycle

- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original engineering: candidate 55bb0754-355b-4940-aaea-aed7123e7e57 / operation edebcb32-335b-49f0-b527-eb4289f95c5c, owner agent:agent-integration-engineer
- Exact production signed-admin source proof: 44432cdf7dc7329e198d34c30a8eb42e3d816884, Netlify deploy 6af9cae9dc3bd6f136856875, GitHub Actions run 43728192839 verified 164 internal historical execution events but only 163 source-joined to MUTABLE latest action executed_at; originally one source gap
- Independent SQL cause: original action 1be12b8f-8d43-42e1-b0da-d8ce20291ee4 historical execution 06:38:16 UTC, re-executed 15:05 UTC, original immutable writer did not mint a second execution event because same decision cycle rank already execution; 4 original actions were later executed than last immutable event
- Fix: original protected PL/pgSQL writer gets row lock, action execution attempt timestamp key, new original monotonic 5-stage decision cycle and stage-specific idempotent keys, no new writer/service/cron/table/external side-effect
- Read model: immutable event-time source data remains valid even if current mutable executed_at advances; a later executed_at with no matching immutable attempt event stays separate RED source obligation
- Tests: negative phantom, first cycle preserved, repeated identical attempts idempotent, late replay distinct event, 7d complete source, portal error and historical/source separation, no fake provider/financial proof
- Deployment: not yet protected merged or applied as of development ledger creation; must verify native Supabase migration history and original production pg_get_functiondef, followed by bounded source recovery and existing signed admin probe
- Privacy/security: no row updates to historical events, no email/recipient payload exposed, no extra credential/endpoint/agent; protected Required+CodeQL mandatory
- Closure: 14 original innovations remain OPEN/PLANNED until real agent ACK and measured effect, no fake green
