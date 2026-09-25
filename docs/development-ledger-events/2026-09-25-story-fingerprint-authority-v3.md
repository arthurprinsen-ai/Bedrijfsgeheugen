# 2026-09-25 — Canonical story fingerprint authority v3

- Fingerprint: `powerhouse-story-fingerprint-authority-v3`
- Verification found SQL backfill fingerprint and initial TypeScript live fingerprint differed for the same personal content_id.
- Root cause: two independent normalization implementations.
- Fix: one Postgres function generates all story fingerprints; live publisher calls it by RPC; historical rows are refreshed through the same function.
- Failure policy: fingerprint RPC failure blocks publication before provider side effect.
