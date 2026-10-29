# Canonical agent action measurement coverage in existing Powerhouse portal

Date: 2026-10-29 · Parent: powerhouse-lean-agent-loop-20261029 · Obligation-ID: powerhouse-lean-agent-loop-runtime-coverage-20261029
Status: SOURCE_CANDIDATE_NOT_LIVE

This extends the existing authenticated Powerhouse observability API and System Map tab. It does **not** create another event writer, storage table, cron, scheduler or public endpoint.

The Netlify function reads only the existing canonical `public.powerhouse_cycle_events` through the configured server-side Supabase service key *after* Netlify Identity, Powerhouse admin and tenant resolution checks. Reads are restricted to `tenant_id=canonical`, past 24 hours, immutable window endpoints, page size 1000 and 4000 maximum event rows. Result is aggregate field-presence counts only; raw event IDs, payloads and credentials never reach the UI. Partial pages, drift, denial, invalid count or bounded-limit overflow return UNKNOWN/UNVERIFIED rather than a fake zero.

The existing System Map tab shows cycle-event totals and how many include actor ID, skill version, before metric, after metric and all four. A numeric metric value of 0 counts as present, but field presence alone is not proof of true attribution, outcome or paid revenue.

Read-only baseline: 1,587 events/24h all with idempotency and evidence refs, zero top-level actor/skill/before/after. Runtime writers still need independently verified source instrumentation and business outcomes. This PR only exposes the gap, securely, to prioritize the next repair in the one canonical improvement loop.

Production release: protected Required/BRAIN/CodeQL, full Netlify SHA and authenticated portal readback. No bypass, PII exposure or duplicate publisher.
