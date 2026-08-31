# Learning Plane Cost Guard

Canonical operational runbook for BG166/BG167/BG168 and specialist-agent learning writeback.

## Purpose

The learning plane must preserve every material lesson without allowing learning itself to become a cost, rate-limit, latency or reliability incident.

Primary work always has priority over secondary learning telemetry.

## Canonical components

- BG166 (`7135971`) — append-only Error & Learning Ledger Writer. Canonical immutable learning write path. Deduplicates deterministic fingerprints before writing and coalesces team-context refreshes.
- BG167 (`7136045`) — Shared Multi-Agent Team Context Hub. Heavy current-context projection. Reads bounded shared learning, builds the team briefing, applies canonical contracts and publishes cache projections.
- BG168 (`7136176`) — Multi-Agent Outcome & Learning Router. Classifies material outcomes and dispatches only material learning to BG166. Must fail open relative to the primary agent result.

## Mandatory runtime contract

1. Every unique material learning event is written to BG166 immediately.
2. Duplicate fingerprints terminate without another immutable record.
3. Non-material/no-op outcomes terminate in BG168 with `NO_MATERIAL_CHANGE` and must not call BG166 or rebuild BG167.
4. BG166 may trigger at most one heavy BG167 rebuild per active coalescing window.
5. In cost-recovery mode the canonical BG167 refresh bucket is hourly: `bg167-refresh:YYYYMMDDHH`, with `window_seconds=3600`.
6. Additional material learning during the same bucket remains persisted in BG166 but returns a coalesced refresh result rather than rebuilding BG167 again.
7. Direct/equivalent BG167 callers must not bypass the canonical refresh gate. BG167 accepts canonical refresh context from BG166; duplicate/equivalent direct rebuilds are a regression.
8. BG167 cache-write failure must not return stale pre-enrichment context. Error handlers return the newest valid projected context from the final enrichment stage.
9. BG168/BG166 failures or Make 429s must never invalidate the primary specialist-agent result. Central and local fail-open handling are defense in depth.
10. Never blind-retry Make 429, validation or blueprint failures. After a bounded identical attempt, change hypothesis/fallback and persist the fingerprint.

## Cost evidence and incident baseline

Observed on 2026-08-30:

- Daily Make credits fell from 10,000 to 835: 9,165 credits consumed.
- BG167 was executed dozens of times within minutes.
- Recent BG167 rebuilds consumed roughly 7–11 credits, 5–6 operations and about 130–194 KB transfer per run.
- BG168 normal routing was substantially lighter, typically 3 credits and 2 operations per run.

Therefore the primary cost hotspot is repeated BG167 projection/rewrite, not the lightweight material classifier itself.

Release must be rejected if equivalent BG167 refreshes execute more than once per configured coalescing window, unchanged context causes repeated heavy writes, or a no-material BG168 event causes BG166/BG167 activity.

## Proven recoveries

### Learning credit storm

Fingerprint: `make|multi-agent-context-learning-credit-storm|2026-08-30-v1`

Prevention:

- deterministic fingerprint dedupe;
- material-only routing;
- hourly BG167 projection in cost-recovery mode;
- no direct rebuild bypass;
- no-op canary must produce no new BG167 execution.

### BG167 stale fallback context

Fingerprint: `bg167|stale-fallback-context|2026-08-30-v1`

Root cause: a BG167 cache write received Make 429 and its error handler returned an older upstream context, making runtime appear to regress from the current contract to an older team-contract version.

Fix: cache-write error handlers must return the final enriched context, currently the output after the continuous-delivery enforcement stage, never module-4/module-8 intermediate context.

Regression rule: after any projection/enrichment stage is added, every success and error return path must be checked for monotonic context freshness.

### Central learning fail-open

Fingerprint: `learning-router|bg168|central-fail-open|2026-08-30-v1`

BG168 catches BG166/logging failure and returns a deferred-learning outcome instead of propagating the learning failure into the primary agent result.

Local specialist-agent error handlers remain required defense in depth on the `Share agent outcome with team learning` module. PH01–PH10 and PH12–PH16 are now configured with local fail-open handlers; PH11 already had equivalent built-in Resume/error handling. The rollout completion fingerprint is `agent-fabric|learning-fail-open|ph01-ph16-v2`.

## Canonical learning contracts

BG167 current context must expose the permanent learning contracts, including:

- `self-heal-v1`
- `evidence-status-v1`
- `cost-performance-v1`
- `no-duplicate-learning-v1`
- `learning-fail-open-v1`
- `notion-richtext-bound-v1`
- `attribution-root-v1`
- `commercial-learning-v1`
- `cost-evidence-v1`
- `retry-v1`
- `content-lifecycle-v1`
- `automatic-registration-v1`
- `documentation-sync-v1`
- `known-regression-v1`

A context build that loses these contracts is a projection regression, not a new design problem.

## Notion bound

Fingerprint: `make|7135971|VALIDATION_ERROR` / canonical rule `notion-richtext-bound-v1`.

Each Notion `rich_text[].text.content` item has a hard 2,000-character limit. Assembled evidence/context uses a safe maximum of 1,800 characters.

## Verification sequence

For a material learning-plane change:

1. Read current BG166/BG167/BG168 blueprints and last-edit identities.
2. Match existing fingerprints before changing anything.
3. Apply the smallest atomic change.
4. Run one material learning event.
5. Confirm `learning_persisted=true` or a new BG166 record id.
6. Confirm no more than one BG167 rebuild in the active coalescing bucket.
7. Confirm BG167 returns the latest team contract and canonical learning contracts.
8. Run one `NO_MATERIAL_CHANGE` BG168 canary.
9. Confirm the canary created no BG166 write and no BG167 rebuild.
10. Record recovery/improvement evidence in BG166.

`CONFIGURED` or `PATCHED` is never equivalent to `VERIFIED RUNTIME GREEN`.

## Current last-known-good evidence

2026-08-30 runtime evidence established:

- BG167 returned `TEAM-CONTRACT-v2.1-ALL-APP-CONTINUOUS-CICD` with canonical learning contracts after the stale-fallback fix.
- A new material recovery event produced one BG167 rebuild consuming 9 credits / 6 operations / 178,505 bytes transfer.
- A subsequent BG168 no-material canary returned `NO_MATERIAL_CHANGE` and produced no second BG167 rebuild.
- Recovery fingerprint: `learning-plane|hourly-coalesce-and-safe-reactivation|2026-08-30-v1`.

## Delivery-path classification lesson

Fingerprint: `github|brain-delivery|docs-learning-path-classification|2026-08-30-v1`.

A new learning runbook created at `docs/learning-plane-cost-guard.md` failed the BRAIN delivery plan because `config/brain-delivery-system.json` classifies `docs/learning/` as a shared Brain path, not arbitrary `docs/learning-*` files. The correct recovery is to place governed learning documentation under `docs/learning/`, not weaken the delivery classifier.

Docs-only/ignored-only work must still be classified deterministically. A known canonical namespace should be reused instead of expanding policy ad hoc for one file.

## Governed docs are non-executable work

Fingerprint: `github|brain-delivery|docs-learning-zero-lanes|2026-08-31-v1`.

A second cost regression was found after the path-classification fix: `docs/learning/` was governed as a shared Brain path and therefore started all four executable delivery lanes for a documentation-only change.

The production rule is now:

- `docs/learning/**` remains Brain-governed and must never become `unclassified`;
- it is explicitly non-executable shared work;
- a docs-only learning change returns `integration.required=false` and `lanes=[]`;
- mixed changes containing executable code/config still trigger their normal relevant lanes;
- do not weaken shared-path governance merely to save CI cost.

The fix was implemented TDD RED→GREEN, harmonizing both the new regression test and the older learning-path governance test, and merged to `main` via PR #721. This is the canonical pattern for reducing delivery cost without creating a policy bypass.

## Portal cost projection is cache-first

Fingerprint: `portal|cost-dashboard|blob-hit-no-notion|2026-08-31-v1`.

Before changing a suspected cost hotspot, re-read current `main`. A previously identified cost-dashboard issue had already been resolved by concurrent work: `netlify/functions/_cost-projection-store.mjs` now reads the Blob projection first and only calls Notion when the Blob record is absent.

Permanent regression contract:

- valid `POWERHOUSE/cost-dashboard/current` Blob hit => zero Notion reads;
- token-usage enrichment may run independently and must not force a Notion read;
- missing Blob => exactly one bounded Notion fallback read;
- do not rebuild an already-correct fix from stale chat/context assumptions.

`tests/portal-cost-projection-store.test.mjs` enforces both the zero-Notion cache-hit path and the single-fallback cache-miss path on `main`.

## Learning writeback when Make is paused

Fingerprint: `learning-plane|make-paused-writeback-deferred|2026-08-31-v1`.

On 2026-08-31 a BG168 learning-write attempt was refused because the Make organization/team was paused after exceeding operations or data-transfer limits.

This is not a reason to blind-retry. Required behavior:

- preserve the primary engineering result;
- persist durable human-readable learning in the canonical repository documentation immediately;
- keep one explicit replay obligation for BG168/BG166 when Make becomes writable again;
- dedupe that obligation by stable fingerprint instead of treating every blocked attempt as a new incident;
- verify Make state before replay and perform one bounded write attempt, not periodic retry traffic.

This is the concrete fail-open application of `learning-fail-open-v1` and `repeated-known-blocker-no-state-v1` to the learning plane itself.

## Completion gate

A chat, agent run or development task involving material technical/operational learning is not complete while the learning exists only in conversation text or transient logs. Completion requires:

- durable fingerprinted learning in BG166;
- projection into shared context when appropriate;
- human-readable documentation update for architecture/root-cause/prevention changes;
- explicit open obligations for anything not physically completed;
- runtime evidence before a green claim.
