# Portal stage timing — 20 October 2026

Obligation-ID: portal|authenticated-entrepreneur-stage-latency-isolation|20261020

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

Observed failure: authenticated entrepreneur API 504 from Netlify in approximately 30 seconds. Supabase Edge endpoint sometimes failed after approximately 90 seconds, with concurrent Postgres timeouts. The specific slow database stage remains unknown.

Proposed recovery: stage-name, anonymous trace and elapsed milliseconds when any of the existing ten reads is slow or fails. Keep tenant isolation and reject partial results. No production rollout until required checks and authenticated readback pass.

Regression test: tests/brain-portal-state-read-stage-telemetry-p0-4215.test.mjs.

Acceptance remains open: validated slow-query fix, two-tenant signed API success, Frisse Blik to Brain/Heartbeat/dashboard propagation.
