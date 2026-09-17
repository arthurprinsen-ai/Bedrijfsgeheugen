# Instagram exact-final-media proof learning v1

Date: 2026-09-17
Fingerprint: `instagram-exact-final-media-proof-v1`
Scope: Bedrijfsgeheugen Powerhouse / Instagram / Mira identity / delivery governance
Status: CANONICAL LEARNING

## Incident

The Instagram/Mira hard gate was strengthened to require immutable proof of the exact final media that is published. A first implementation candidate introduced a dedicated regression test file whose path was not classified by the canonical BRAIN delivery system. The required GitHub Actions preflight therefore failed before backend tests executed.

This was a delivery-classification defect, not a failure of the Mira identity logic itself.

## Root cause

The new test file `tests/bg-pre-publish-review-mira-exact-final-media.test.mjs` did not match any configured delivery-lane path pattern. `createDeliveryPlan` correctly fails closed on unclassified paths. The test therefore created delivery drift even though the implementation file `supabase/functions/bg-pre-publish-review/index.ts` belonged to the backend lane.

Fingerprint for this failure mode: `delivery-unclassified-regression-test-path-v1`.

## Fix

The duplicate standalone regression test was removed. Its assertions were folded into the existing canonical contract `tests/supabase-powerhouse-content-edge-surface-contract.test.mjs`, which is already executed by the backend release lane.

The Instagram pre-publish gate now requires, fail-closed:

- exact canonical Instagram Buffer channel;
- `final_media_sha256`;
- `exact_final_media_proven=true`;
- exact final asset URL;
- verified visual evidence with `evidence_refs`;
- visual identity class `mira_daily_life`;
- no placeholder/broken render;
- inspected asset URL equal to the final publication asset;
- publish-format verification;
- for reel/video: verified start, middle and end frames, each with evidence references and Mira identity.

Provider `sent` status remains transport evidence only. It never implies Mira identity PASS or exact-final-media proof.

## Verified release lineage

- stale candidate: PR #1912, intentionally superseded;
- current-main successor: PR #1913;
- successor head before merge: `f82c003ad1f6ec0be2eae3aa99d15097f24ffa82`;
- protected merge SHA: `eeadabbb7dbef337953dd6abbfb0445bfe673296`;
- protected `main` remained guarded by required `test` status;
- delivery classifier, Supabase security checks, Portal V2 suite, existing unwired contracts, completion/release contracts, Fast Development Protocol v2 and backend selection all passed before protected merge.

## Permanent prevention rules

1. `NEW_REGRESSION_TEST_MUST_HAVE_CANONICAL_DELIVERY_OWNER` — before adding a test, prove its path maps to an existing canonical lane or place the assertions in the existing owned contract.
2. `UNCLASSIFIED_DELIVERY_PATH_FAILS_CLOSED` — never weaken this guard to make a candidate green.
3. `REUSE_EXISTING_TEST_CONTRACT_BEFORE_CREATING_PARALLEL_TEST_SURFACE` — extend the existing canonical contract when semantics and ownership match.
4. `PROVIDER_TRANSPORT_IS_NOT_FINAL_MEDIA_IDENTITY_PROOF` — provider acceptance/sent state cannot prove exact bytes, frames, identity or visual correctness.
5. `INSTAGRAM_EXACT_FINAL_MEDIA_PROOF_REQUIRED` — no Instagram dispatch PASS without exact final-media digest, asset binding and visual/frame evidence.
6. `MOVING_MAIN_REQUIRES_CURRENT_MAIN_SUCCESSOR` — when protected main advances materially, replay the minimal verified diff on current main rather than merging stale lineage.
7. `NO_GREEN_BY_REPUBLISH` — an existing unproven publication is never regenerated, replaced or republished merely to satisfy evidence gates.

## Reusable diagnostic sequence

When a Required test fails in `Classify independent delivery lanes`:

1. inspect changed paths before debugging product logic;
2. compare each path with `config/brain-delivery-system.json` lane/shared/ignored patterns;
3. distinguish `unclassified delivery path` from test/runtime failure;
4. prefer folding regression assertions into the existing canonical owned contract when appropriate;
5. rerun exact-head Required test and confirm the intended lane is selected;
6. only then interpret downstream backend/test results.

## Open obligation

The historical 2026-09-17 Instagram publication remains `UNPROVEN/BLOCKED` unless the exact final bytes/frames can be independently read back and bound to the canonical publication lineage. This learning does not retroactively mark that item green and does not authorize regeneration or republication.

Required terminal evidence for that publication remains: exact final-media digest/hash, exact canonical copy, provider post/media lineage, verification timestamp, visual/frame evidence and Mira identity-gate result.

## Definition of done for future Instagram items

An Instagram item can be considered publication-proof complete only when the canonical delivery lane can read back enough immutable evidence to prove that the exact media published is the same media that passed the Mira/identity and format checks. If exact bytes/frames cannot be retrieved, status remains `UNPROVEN/BLOCKED`.
