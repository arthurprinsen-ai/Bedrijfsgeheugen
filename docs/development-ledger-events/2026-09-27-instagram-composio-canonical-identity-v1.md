# Development ledger event — instagram-composio-canonical-identity-v1

- Date: 2026-09-27
- Obligation: social-publish-resilience-v1
- Failure class: WRONG_EXTERNAL_IDENTITY
- Surface: `powerhouse-social-publisher` / `instagram_company`
- Root cause: Composio alias/provider-id dedupe did not prove the Bedrijfsgeheugen username; Instagram still had Buffer/direct-Meta fallbacks.
- Runtime change: Composio-only, exact username gate `bedrijfsgeheugen.nl`, explicit numeric `ig_user_id`, schema-driven create/publish/readback.
- Recovery semantics: wrong/missing identity remains `content_ready`; same daily winner/media lineage is reused; no replacement publish.
- Skill projection: `.agents/skills/instagram-composio-publisher/SKILL.md`
- Brain learning: `brain/learning/2026-09-27-instagram-composio-canonical-identity-v1.json`
- Test: `tests/brain-instagram-composio-canonical-identity-v1.test.mjs`
