# 2026-10-06 — Social recovery HTTP data plane v1

Obligation-ID: social-recovery-http-data-plane-20261006-v1
Delivery-Lane: backend
Candidate-Type: recovery
Base-SHA: a94b67cd258730d6d50f20fa34d8f3490601f71d
Change-Scope: supabase/functions/social-recovery-runner/index.ts, tests/brain-social-recovery-http-data-plane-v1.test.mjs, brain/learning/2026-10-06-social-recovery-http-data-plane-v1.json, docs/changes/2026-10-06-social-recovery-http-data-plane-v1.md, docs/development-ledger-events/2026-10-06-social-recovery-http-data-plane-v1.md
Scope-Budget: 5

Observed:
- final Supabase Edge authority on current protected main succeeded with byte-for-byte provider parity;
- same-day canonical recovery run 37492491110 reached social-recovery-runner v26;
- request 01a111f3-c44b-75d2-83ca-8b190f0fc6da failed after 16.659s;
- function log proved direct Postgres authentication did not complete within 15.000ms.

Repair:
- remove npm:postgres and pooler URL rewriting from social-recovery-runner;
- resolve bg_geheim through PostgREST RPC with service-role authorization;
- read canonical decision/obligation state through PostgREST;
- retain existing recovery, idempotency and provider-truth semantics;
- add fail-closed regression against reintroducing direct DB sockets.

Terminal criteria:
exact-HEAD Required + CodeQL -> protected merge -> Supabase GitHub Integration deploy -> Edge authority byte parity -> same-day Social Publication Recovery -> provider-truth readback.
