# 2026-09-26 — linkedin-auth-preflight-before-claim-v1

- Scope: canonical social publishing reliability.
- Failure: provider auth was tested after the daily claim/capability boundary.
- Observed proof: LinkedIn 401 REVOKED_ACCESS_TOKEN on every configured connection; Buffer 429 multi-day cooldown.
- Fix: real LinkedIn provider preflight before claim; auth failures remain resumable with zero provider side effects.
- Duplicate safety: existing provider URNs remain republish-forbidden.
- Regression: `tests/brain-linkedin-auth-preflight-resumable-v1.test.mjs`.
- Skill projection: `.agents/skills/linkedin-composio-publisher/SKILL.md`.
- Brain learning: `brain/learning/2026-09-26-linkedin-auth-preflight-before-claim-v1.json`.
