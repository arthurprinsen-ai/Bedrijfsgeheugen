# Social final-copy + personal-truth incident — 2026-09-17

## Incident
LinkedIn company transport `6aab88626b78718a3938d450` published an internal creative brief instead of final copy. Provider `sent`/transport was therefore not a valid content-success signal. The same day the personal LinkedIn obligation had no live provider post: stored Buffer references were stale/missing, while the recovered artifact did not carry explicit `personal_truth_verified=true`.

## Root causes
1. `linkedin_company` could fall back from the canonical artifact lane to a Buffer Idea. An Idea/brief was therefore dispatchable as though it were final copy.
2. The personal artifact scheduling trigger accepted identity shape fields but did not require explicit verified personal truth, and the current canonical orchestrator stores identity evidence under `generation_evidence.identity_gate_evidence`. Legacy and canonical evidence shapes were not normalized consistently.
3. Reconciliation treated provider transport proof as sufficient to progress a social obligation even when content integrity itself had been invalidated.

## Permanent prevention
- Fingerprint `company-final-copy-artifact-only-v1`: LinkedIn company delivery requires a canonical `linkedin_post` artifact with `final_copy_approved=true`; Buffer Ideas and internal briefs can never be a delivery source. Provider text must equal the approved artifact.
- Fingerprint `linkedin-personal-verified-truth-before-schedule-v1`: personal LinkedIn cannot enter scheduled/published/measured/learned or dispatch states without explicit `personal_truth_verified=true`, identity PASS, concrete personal anchor, and non-corporate style. Nested canonical evidence and legacy top-level evidence are both understood; truth is never inferred.
- Fingerprint `social-content-integrity-invalidation-v1`: `provider sent` is transport evidence only. When `content_integrity_invalidated=true`, reconciliation remains fail-closed `BLOCKED` and may not promote the item to `LIVE_PROVEN`, measurement, or learning.

## Regression evidence
`tests/social-learning-buffer-delivery-guarantee-regression.test.mjs` reproduces the exact internal-brief escape, verifies canonical company final-copy marking, verifies explicit personal truth before scheduling, and verifies content-integrity invalidation overrides provider-sent transport.
