# 2026-11-15 — Netlify weigert originele innovatie-code ondanks groene CI

- **P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Oorspronkelijke kandidaat:** `55bb0754-355b-4940-aaea-aed7123e7e57`, eigenaar `agent:agent-integration-engineer`
- **Protected source implementation:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857, exact merged `main` SHA `875244148e910e43928a11221f6e75496f491ebb`
- **Independent negative deployment receipt:** Netlify production deploy `6af9bc3634ea5ebd680aecf4` at that SHA returned `state=error`, `Failed during stage 'checking build content for changes': Canceled build due to no content change`.
- **Prior actually published production SHA:** `00c99582067fc38dd1dfc2ab8a97c87f89c20c5d`; source implementation not yet live as of diagnosis
- **Root cause:** `platform/portal/powerhouse-existing-integration-read-model.mjs` is imported into `netlify/functions/powerhouse-control-plane.mjs`, but was NOT in canonical `NETLIFY_RUNTIME_EXACT` or `NETLIFY_RUNTIME_PREFIXES`. Backend-lane classification can therefore yield `deploymentRequired=false` and Netlify skips the changed bundle.
- **Correction:** original classifier now declares the exact imported admin module as Netlify runtime. Existing authenticated admin handler emits a minimal source audit scope header only after Identity and admin verification; same original read-only source, no new function, store, scheduler, credential or side effect.
- **Regression:** `tests/brain-netlify-imported-innovation-runtime-v1.test.mjs`: imported source forces deployment; governance-only changes do not; admin coverage header follows original auth; stale SHA cannot be marked live
- **Safety:** fail-closed status, no PII/secret, original ONE BRAIN record stays PLANNED with pre-review and protected candidate evidence; no consumer ACK or customer outcome invented
- **Release:** protected Required + CodeQL, verified new Netlify exact SHA READY, authenticated original admin scope response, independent Heartbeat and then original owner ACK
- **Rollback:** only protected revert via canonical delivery, preserving source rows and immutable evidence
