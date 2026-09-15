# Powerhouse failure-learning contract v1

Contract ID: `powerhouse-failure-learning-contract-v1`
Revenue north star: `growth-revenue-os-1m-2027-v1`
Canonical revenue deadline: 2027-09-14

## Purpose

Powerhouse must become more reliable and commercially effective after every failure. A failure is not closed because a symptom disappeared. Closure requires evidence that the root cause is understood, the fix is proven, the failure is prevented at the correct architectural boundary, and the learning is written back into the same canonical system that will make the next decision.

## Mandatory closed loop

Every operational, publishing, content, forecasting, integration, release or learning failure follows this loop:

`detect -> contain/fail closed -> preserve evidence -> root cause -> regression test -> minimal fix -> gated verification -> production readback -> failure-registry writeback -> next-run application`

No step may be replaced by a status claim. `fixed`, `live`, `published`, `completed`, `learned` and `green` require execution/readback evidence.

## Canonical storage

Runtime failure memory is stored in `public.brain_failure_registry`. Each reusable failure fingerprint must contain at least:

- deterministic `fingerprint`;
- `maturity` (`OBSERVED` until proven, `PROVEN` only after verified recovery);
- root cause;
- proven fix;
- prevention rule;
- regression reference;
- occurrence count;
- evidence lineage and relevant provider/release identifiers.

Do not create a parallel failure-memory store. New failures must reuse this registry and its existing Brain lineage.

## Permanent rules learned from the 2026-09-14/15 content-release incident

### 1. Governed writer output is a JSON array

Fingerprint: `approved-central-blog-json-array-parser-v1`.

A valid governed candidate must never be silently converted into `NO_ACTION` because a workflow assumes JSONL/object-per-line output. Parse one complete JSON array and fail closed when the output shape is invalid.

### 2. Approved source hashes use one canonical representation

Fingerprint: `approved-central-blog-source-hash-representation-v1`.

Only the canonical writer may seal the approved source hash. The hash must be computed from the exact Notion API representation later used for verification. Never seal from rendered Markdown when verification uses `plain_text`.

### 3. Zero-job `action_required` is not verification

Fingerprint: `github-actions-bot-pr-action-required-v1`.

A PR whose required workflows are `action_required` with zero jobs has not passed anything. Preserve the immutable candidate head and retrigger through the normal PR identity/event path. Never treat missing jobs as green and never mutate candidate content merely to obtain a trigger.

### 4. SEO requirements belong in the generator

Fingerprint: `approved-central-blog-seo-contract-missing-v1`.

FAQPage structured data, required figures and other technical SEO output contracts must be emitted by the canonical generator and protected by regression tests. Do not patch a single generated article and leave the generator defective.

### 5. Performance thresholds are fixed; generators are optimized

Fingerprint: `approved-central-blog-font-performance-v1`.

Do not lower Lighthouse thresholds to release content. Remove systemic render/network cost in the generator. The proven recovery removed external Google Fonts link tags while retaining local/system fallbacks. Verified candidate result: performance 92, accessibility 98, best practices 100, SEO 100.

### 6. Release risk follows the artifact boundary

Fingerprint: `release-risk-generator-preview-classification-v1`.

Generator/control-plane changes do not require a website preview merely because they can eventually produce web content. The generated public artifact does require full preview/browser/SEO/Lighthouse verification. Classifiers must distinguish these boundaries explicitly.

### 7. Scheduled is not delivered after due time

Fingerprint: `scheduled-is-not-delivered-provider-readback-v1`.

A future scheduled item may count provisionally. A past-due scheduled item never counts as delivered. Require provider-published evidence and reconcile provider state back into `powerhouse_channel_decisions` before the day can become complete.

## Daily operational behavior

Before a new fix or release, Powerhouse should query applicable failure fingerprints and use their prevention rules as preflight constraints. After any new failure:

1. create or update exactly one deterministic fingerprint;
2. preserve the failing evidence before mutation;
3. add a regression that fails for the actual root cause;
4. implement the smallest architectural fix;
5. verify the regression plus all affected release lanes;
6. obtain production/provider readback;
7. promote maturity to `PROVEN` only after that readback;
8. feed the rule into the next decision/run.

Repeated occurrences increment the same fingerprint. They do not create a new learning unless the root cause is materially different.

## Commercial learning

Failures are also revenue evidence. Powerhouse must measure whether prevention improves throughput to the revenue north star:

`signal -> forecast/opportunity -> content/action -> delivery -> engagement -> site -> qualified lead -> meeting -> proposal -> order -> realized revenue`

Learning priority is based on downstream commercial impact, not engineering novelty. A failure that blocks orders, publication, sales follow-up, provider proof or forecast calibration receives higher remediation priority than a cosmetic issue with no measurable commercial effect.

## Non-negotiable completion rule

A run may not be marked completed when a selected publish/action obligation lacks supported execution evidence. The system remains degraded/blocked until the obligation is delivered, intentionally held/skipped by the canonical decision, or converted into one explicit resumable obligation with evidence.
