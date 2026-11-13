# BRAIN migration-history original 838 prefix / later provider 839 acceptance
Date 2026-11-13. Fingerprint `portal|brain|historical-native-838-test-hard-coded-terminal-after-provider-839|20261113-v1`. Existing Portal P0 #4215, source-lock protected PR #5710 and exact original BRAIN run #43380911816.

## Observed independent failure
The original after-merge BRAIN backend ran >6,500 tests, failing two: original historical `838` test required `lock.applied.length===838` after original immutable provider and main source lock advanced to real 839, and a separate Mira playbook heading near top of AGENTS. The latter is already owned by [PR #5708](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5708); DO NOT duplicate it.

## Original test contract correction
Keep the old 838 indexed source identities exact and uniqueness test, require length at least 839 and exact provider-applied 839th `20261113060000/portal_brain_record_contract_parity_v1` plus existing official SQL filename. This permits verified later 840+ without treating newly applied migrations as corruption, while preserving historical monotonic prefix integrity. No SQL, lock data, RLS, new executor, workflow, scheduler, provider access, or tenant data changes.

## Acceptance
Canonical learning evaluation on original `tests/brain-original-native-838-source-ack-20261112.test.mjs` plus protected Required/BRAIN/CodeQL and original postmerge BRAIN/terminal rerun, distinguish concurrently owned AGENTS #5708. Separate customer source/consumer/outcome remains EVIDENCE_DUE.
