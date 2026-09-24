# Development ledger — People evidence source registry v1

Date: 2026-09-24
Obligation-ID: `powerhouse-people-evidence-source-registry-v1`
PR: #2834
State: CANDIDATE_UNTIL_PROTECTED_MERGE_AND_PRODUCTION_READBACK

## Material change
Introduces the canonical external evidence registry for people/workforce problems `PH-P031` through `PH-P040`, binds detection to that registry, and projects provenance/freshness/legal-status rules into the Problem Radar skill.

## Root cause
The people detection layer referenced source families in prose, but source identity, applicable Problem IDs, freshness and legal/policy status were not modeled as canonical machine-readable state.

## Prevention
All external people evidence must be registered with provenance, evidence role and freshness/status before it can support current cockpit, content or opportunity claims. Policy proposals remain explicitly non-current until verified in force.

## Evidence
- `config/powerhouse-people-evidence-sources.json`
- `config/powerhouse-people-problem-detection.json`
- `tests/brain-powerhouse-people-evidence-source-registry-v1.test.mjs`
- `brain/learning/2026-09-24-powerhouse-people-evidence-source-registry-v1.json`
- `docs/changes/powerhouse-people-evidence-source-registry-v1.md`
- `skills/mkb-voice-of-customer-problem-radar.md`

## Terminal contract
Only protected merge to `main`, successful production deploy and exact production readback may promote this obligation to LIVE_BEWEZEN.
