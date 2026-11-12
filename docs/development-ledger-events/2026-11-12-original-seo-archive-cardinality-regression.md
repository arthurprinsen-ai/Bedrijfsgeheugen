# 12 Nov 2026 — Original daily SEO source manifest fails after ninth source

- Fingerprint: `seo|original-archive-derived-cardinality-regression|20261112-v1`.
- Independent production fact: #837 already applied; derived SEO source branch exists; original #175 invocation raises `SQLSTATE 23514 GROWTH_SOURCE_MANIFEST_INCOMPLETE:9` and rolls back.
- Causal failure: `v_saved<>8` was never updated when ninth source was inserted into existing CTE by #5692.
- Fix candidate: targeted fail-closed native migration with derived-source presence guard, one original agent task, skill update, replay and Brain learning. No second scheduler, SQL-in-prod bypass, speculative SEO growth, or changed immutable identity.
- Release is not proved merely by code. Verify protected checks, current main/native migration parity, source archive output, Brain #140 ACK, Heartbeat same SHA, and eventually observed CRO/customer outcomes. Keep downstream obligation open until then.
