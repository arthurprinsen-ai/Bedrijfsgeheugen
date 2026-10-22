# 2026-10-22 — Content-loop fan-out legacy-oracle herstelcheckpoint

- Obligation: `p0-4198-anthropic-internal-deadline-20261010`; parent #3742; fingerprint `brain|ci|content-loop|obsolete-single-generation-oracle|20261022-v1`.
- Baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071 ; head `8e665a86d2bb54712a34fd88bec0e1213df21dd2`; 3526/3171/355; 1 original assertion in scope.
- Root cause: existing test expects obsolete global `MAX_CHANNEL_GENERATIONS` and `bootstrapAttempted` while current supervisor gates in-flight bootstrap and performs canonical channel-bound fan-out.
- Corrected: one test file; preserved 90s child / 110s supervisor, per-channel bounded generation, provider-side-effect and publication ACK checks.
- Durable learning: `brain/learning/2026-10-22-content-loop-fanout-oracle-v1.json`, projection target Powerhouse Continuity; same parent incident; no duplicate scheduler or registry.
- Terminal evidence: **PENDING** exact-head Required/CodeQL, full BRAIN 0-fail, protected promotion, production readback and registry/skill readback. No LIVE claim.
