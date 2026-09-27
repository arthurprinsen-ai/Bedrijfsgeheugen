# Development ledger event — instagram-composio-canonical-graph-id-v2

- Date: 2026-09-27
- Obligation: social-publish-resilience-v1
- Failure class: WRONG_EXTERNAL_IDENTITY
- Canonical username: `bedrijfsgeheugen.nl`
- Canonical Instagram Graph User ID: `17841446582493753`
- Known wrong OAuth identity: `arthurprinsen` / `28328860976766075`
- Runtime change: remove `me` from canonical identity resolution; probe explicit Graph ID before publication authority; bind create/publish to the explicit canonical ID.
- Recovery: wrong/missing OAuth access remains recoverable; no replacement media and no alternative transport.
- Skill: `.agents/skills/instagram-composio-publisher/SKILL.md`
- Brain: `brain/learning/2026-09-27-instagram-composio-canonical-graph-id-v2.json`
- Regression: `tests/brain-instagram-composio-canonical-identity-v1.test.mjs`
