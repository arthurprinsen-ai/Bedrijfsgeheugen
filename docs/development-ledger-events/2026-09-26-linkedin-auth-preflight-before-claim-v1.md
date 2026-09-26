# 2026-09-26 — linkedin-auth-preflight-before-claim-v1

- Scope: canonical social publishing reliability.
- Failure: provider auth was tested after the daily claim/capability boundary.
- Observed proof: LinkedIn 401 REVOKED_ACCESS_TOKEN on every configured connection; Buffer 429 multi-day cooldown.
- Fix: real LinkedIn provider preflight before claim; auth failures remain resumable with zero provider side effects.
- Duplicate safety: existing provider URNs remain republish-forbidden.
- Regression: `tests/brain-linkedin-auth-preflight-resumable-v1.test.mjs`.
- Skill projection: `.agents/skills/linkedin-composio-publisher/SKILL.md`.
- Brain learning: `brain/learning/2026-09-26-linkedin-auth-preflight-before-claim-v1.json`.


## Delivery recovery

- First exact-head CI was rejected before expensive tests because PR delivery metadata was absent.
- Quality-surface discovery also exposed two pre-existing RPCs used by the changed publisher that lacked registry contracts: `powerhouse_reserve_unique_publication_v1` and `powerhouse_story_fingerprint_v1`.
- Learning canonicalization rejected a non-file shadow-evaluation label.
- Same lineage correction: PR metadata added, both RPCs registered with test evidence, and all learning evaluation entries now reference repository test paths.
- Branch protection remains authoritative; no bypass or direct main write is permitted.
