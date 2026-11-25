# Original Mira direct-media preflight: BRAIN literal oracle drift

Date: 2026-11-05  
Parent: #4439 · Source owner: original Powerhouse content loop and existing BRAIN backend  
State: TEST_ORACLE_CORRECTED / PROTECTED_CI_DUE / NO_LIVE_CLAIM  
Fingerprint: `brain|mira|media-job-readonly-direct-adapter-stale-expected-projection|20261105-v1`.

## Provider-observed failure and root cause
Original postmerge BRAIN delivery run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41993721022, backend job https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41993721022/job/127132117396, failed exactly one source-contract test: `tests/brain-content-loop-preventive-media-direct-adapter-20261103.test.mjs`, test #1097.
The test expected `channel,status,last_error,asset_manifest,proof_manifest`, but the original protected #5431 source includes an additional observed `attempts` field, selecting `channel,status,attempts,last_error,asset_manifest,proof_manifest`. This is a literal test-oracle drift, not proof of lost media data, and should not cause the original producer to be replaced.

## Safe same-lineage correction
Replace only the obsolete literal in the original BRAIN test; additionally assert the original tenant `canonical`, publication date and `instagram` channel filters. Preserve original `DB_READ_ONLY_TABLE_REJECTED` and strict DB table allowlist. Do not edit `supabase/functions/powerhouse-content-loop/index.ts`, loosen writer lease, rerun social publishing, or add a duplicate engine. Carry original learning JSON, this append-only ledger and human documentation in the same protected PR.

## Acceptance
New exact-head Required and CodeQL, full BRAIN and protected merge must be proven. To avoid invalidating the concurrent Portal live release's exact-SHA browser acceptance, hold this **draft** candidate until that separate original Portal deployment/browser proof completes. Postmerge BRAIN must then be independently rechecked. No false-green production, provider-publication or media proof is claimed.
