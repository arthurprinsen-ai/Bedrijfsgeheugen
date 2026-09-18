# Runner-capacity live closure — 2026-09-18

Fingerprint: `delivery|runner-capacity|live-closure|v1`

PR #2132 was recovered on the same canonical lineage after two fail-closed signals: invalid candidate metadata and main drift. The recovery candidate was rebuilt on current main with full-main-union semantics so existing Powerhouse learning, borging-closure rules and regression tests were preserved.

Terminal evidence:
- candidate head: `6290eebf1a50a39f11f14d095ab7d503fe468cc3`;
- protected merge/main: `95ea2a673c8a3f801aea77cf8b3a81ae1232aea9`;
- Required: success;
- BRAIN: success;
- CodeQL: success;
- skill projection: success;
- Netlify production deploy: `6aad2cc7bfe37a0008c5d325`;
- Netlify state/context: `ready` / `production`;
- Netlify commit_ref: exact main SHA `95ea2a673c8a3f801aea77cf8b3a81ae1232aea9`.

Reusable prevention:
1. Validate delivery metadata before expensive CI.
2. When main moves and reconciliation is required, rebuild from current main using full-main-union semantics rather than overlaying only the latest commit.
3. Recovery changes are additive: never drop previously proven learning, borging or regression coverage.
4. LIVE_BEWEZEN requires exact production/provider readback of the merged commit or a verified descendant.
