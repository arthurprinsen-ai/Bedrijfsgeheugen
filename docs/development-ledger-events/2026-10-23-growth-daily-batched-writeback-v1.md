# 2026-10-23 — Canonical daily Growth Intelligence batching

- Obligation: `growth|daily-intelligence|bounded-durable-writeback|20261023-v1`.
- Preflight: existing PR #4817 merged and independently deployed; old 06:00 UTC credential error independently verified in Netlify logs; no daily scorecard newer than September 13.
- New suspected risk: sequential growth/Brain PostgREST calls under strict 30-second provider cap. Distinguish likely future timeout from the already observed credential failure.
- Recovery: coalesce writes for exact natural keys and bound 40 rows per table upsert; await durable flush and propagate provider rejection; no parallel scheduler or alternate Brain.
- Regression oracle: `tests/brain-seo-cro-execute-or-explain-v1.test.mjs`.
- Endpoint reachability, valid credentials, test passes and Green CI are not equivalent to a real completed commercial run; runtime/readback obligation stays open.
