# Postmerge BRAIN delivery: fix historical provider-824 oracle and research-only model freshness gate

Date: 2026-11-11. Original owner: BRAIN/backend; parent #4198; related #4215; release PR #5611. Fingerprint: `brain|delivery|postmerge-historical-824-and-model-directory-freshness|20261111-v1`.

## Observed production-side CI failure
After protected merge of #5611 to main `550b020eeb3e03c6ffc7d0356cbb62c2ac4180ad`, the independently triggered BRAIN delivery run [43014341068](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43014341068) failed three of 6313 backend tests:
- `tests/brain-ai-model-intelligence-v1.test.mjs`: at least one third-party research-only model (gpt-6-astra) has historical supplier evidence older than 14 days. **It has not been independently reverified and must not be promoted to automatic recommendation.**
- `tests/brain-supabase-provider-health-native-ledger-parity-20261110.test.mjs`: hardcoded `824` current-size expectation despite actual immutable 826 history.
- `tests/brain-verified-provider-health-native-reconciliation-20261110.test.mjs`: a historical 823→824 one-time replay helper received the *current* 826-version ledger rather than its exact historical 824-prefix.

## Correct repair
- Preserve source evidence, all 826 provider-applied migration identities and the exact historical 823→824 anti-replay helper unchanged.
- The historical ledger test verifies exact entries 823 and 824 and monotonic uniqueness of all later entries; it does **not** require current last entry to remain #824 forever.
- The historical one-time replay test projects a 824-entry fixture from current original history, without amending provider or source SQL; negative corruption/tamper/preview expectations stay intact.
- The AI directory guard checks dates for every record and requires freshness **whenever eligible for auto recommendation**, while stale research-only entries must remain non-eligible. This matches the documented 15 October catalog release boundary and the stricter per-model `tests/ai-model-intelligence-freshness-v1.test.mjs` guard.

## Exit gates
Protected Required/BRAIN/CodeQL, merge only when green, exact head readback. This test-only patch does not certify a refreshed supplier, provider migration, genuine customer loop, Red Dot award or commercial result. Original #4198/#4215 remain OPEN for their genuine consumer/outcome/learning evidence. No new scheduler, publisher, connector, grant, runtime or data mutation.
