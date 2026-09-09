# Content-learning delivery classification — permanent learning

Date: 2026-09-09
Fingerprint: `content-learning-delivery-classification-v1`
PR: #1344

## Incident

The first TDD gate for post feature normalization was correctly RED because `lib/content-learning/post-features.mjs` did not yet exist. After the minimal implementation made the feature contract GREEN, the release pipeline still failed closed because the new content-learning runtime and test families were unknown to the canonical delivery classifier.

## Root cause

`config/brain-delivery-system.json` did not classify the bounded path families `lib/content-learning/` and `tests/content-learning-` into an executable delivery lane. `createDeliveryPlan()` therefore correctly rejected them as `unclassified delivery path`.

## Permanent prevention

1. `lib/content-learning/` is explicitly classified as backend delivery work.
2. `tests/content-learning-` is explicitly classified as backend delivery work.
3. Classification remains bounded: unrelated future `lib/**` or `tests/**` paths must still fail closed.
4. The classifier CI contract contains a regression test that exercises the content-learning runtime/test paths and also proves that an unrelated path remains rejected.
5. New executable path families must be added to the delivery classifier and its regression contract in the same change that introduces the family. A feature is not release-ready when its code tests are green but its delivery ownership is unknown.

## Reusable rule

For every newly introduced executable namespace or test-family namespace: **TDD RED → minimal implementation GREEN → explicit bounded delivery ownership → classifier regression test → exact-SHA Required/BRAIN gates → merge → production readback**. Never weaken fail-closed classification to make a release pass.
