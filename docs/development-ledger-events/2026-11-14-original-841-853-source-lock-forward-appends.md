# 2026-11-14 — Original BRAIN migration-history tests: historical forward-compatible prefix

- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
- Evidence run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43607605829 — original BRAIN backend lane `not ok 2743` and `not ok 3218`
- Root: historical receipt date incorrectly fixed to 13 November; exact-once 853 release helper fed with newer 857-row current native provider lock
- Trusted provider source: original `supabase/migration-history.lock.json`, 857 original native version/name records, unique, immutable 841 index 840, 853 index 852; real provider source unchanged
- Safe original repair: historical 841 valid ISO recapture >= 13 Nov; rebuild original exact 853 candidate in-memory from immutable prefix with native SQL/MD5 and hard-denial tests preserved
- Prevention: fixed historical receipts immutable and append-only; later appends MUST NOT invalidate prior historical proof; live current provider readback remains strict for the full set, no migration replay/rollback
- Existing agent: `agent-data-quality`; existing skill: `release-deployment-readback`; no second executor / no bypass
- Tests: `node --test tests/brain-native-841-source-lock-original-consumer-ack-20261113.test.mjs tests/brain-original-provider-853-outreach-lock-20261114.test.mjs`
- Status at authoring: PROTECTED_RELEASE_CANDIDATE. Actual protected CI/merge, production source parity and next BRAIN Delivery must prove results before GREEN.
