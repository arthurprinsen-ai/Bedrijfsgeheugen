# SEO Learning Lineage — Design

Date: 2026-08-30
Status: proposed
Scope: close the existing SEO/GA4/DataForSEO → Brain → content-generator learning gap without adding a second datastore or duplicate ingestion path.

## Context

The current Powerhouse already has the required building blocks:

- BG87 reads native Google Search Console + GA4, reduces results deterministically per page and writes SEO metric snapshots to the Powerhouse Interaction Datahub.
- BG13 performs evidence-gated SEO optimization from native GSC.
- BG17 and BG53 already use managed DataForSEO keyword and SERP data and write results to Notion.
- BG14 processes eligible social/content learning objects and routes material creative patterns to BG168.
- BG09 reads processed learning champions, cross-channel strategy intelligence, verified research and first-party evidence before generating content.
- BG166/BG167/BG168 provide append-only learning, current-state projection and outcome/learning routing.
- The Powerhouse Interaction Datahub is the active shared evidence/learning store. The separate `Content Learning Engine — dagelijks` database exists but is currently not the active shared learning source and must not be reactivated by default.

## Problem

BG87 SEO snapshots contain useful measured outcome evidence (`Metric Scope=SEO`, page URL, topic/keyword, position, CTR, impressions, conversions, orders, evidence score) but do not currently become a normalized material Pattern that is guaranteed to enter BG168/BG166/BG167 and become directly consumable by content strategy/generation.

This means the SEO cortex learns locally, but cross-cortex reuse is not yet proven end-to-end in the same way social learning is.

## Design principle

Do not create a new importer, database, agent-specific shadow memory or second SEO learning engine.

Extend the existing flow only:

`GSC + GA4 + DataForSEO → existing deterministic SEO decision → material SEO Pattern → BG168 → BG166/BG167 → shared Brain context → BG09/BG24/blog/SEO generators`

All writes remain deduplicated and only material deltas are promoted to Brain learning.

## Canonical source roles

- Buffer: social-media evidence/outcomes where still used as a data source; retired Buffer publisher/reconciler scenarios remain retired.
- Native LinkedIn/Instagram: operational social publishing/metrics where already authoritative.
- Windsor.ai: GA4/Search Console access and cross-check/analysis where useful; it must not duplicate unchanged native Google snapshots.
- DataForSEO: external keyword, SERP, ranking, competitor/backlink/content-gap intelligence.
- Composio: integration/action layer for already authorized connected apps.
- Notion Powerhouse Interaction Datahub: human-readable/auditable evidence and learning projection.
- BG166/BG167/BG168: shared machine learning/event/current-state path.
- GitHub/Netlify/BG169: deployment identity authority; Notion is never deployment authority.

## Required normalized SEO Pattern

A material SEO Pattern routed to BG168 must carry at minimum:

- `schema_version = brain.v1`
- `type = PATTERN`
- `domain = seo_demand`
- stable `fingerprint`
- `trace_id` / `correlation_id`
- `source_component = BG87` or another explicit SEO cortex owner
- page/content identity (`content_id` when available, otherwise page URL + slug)
- topic / focus keyword
- observed evidence window
- current impressions, clicks, CTR, position
- position/CTR/impression deltas
- organic qualified leads / closed leads when available
- deterministic decision (`KEEP`, `TITLE_META`, `EXPAND`, `INTERNAL_LINK`, `CONSOLIDATE_REVIEW`, `WAIT`)
- confidence/evidence score
- concise learning statement
- recommended reusable mechanism, not a full content copy
- protected metrics and rollback/no-op state where applicable

## Materiality gate

Do not route every daily snapshot to BG168. Promote only when one of these is true:

- status changes to or from `Winnaar` / `Verliezer`;
- deterministic next action changes;
- position delta crosses the existing meaningful threshold;
- CTR delta crosses the existing meaningful threshold;
- a first qualified lead/order appears or disappears materially;
- a new baseline becomes sufficiently sampled;
- DataForSEO reveals a new material search-demand/content-gap signal not already represented by fingerprint.

`WAIT`, unchanged metrics and duplicate fingerprints remain local evidence and produce no expensive Brain write.

## Generator consumption

BG09 remains the primary shared content-strategy consumer. It should consume compact SEO Patterns from shared current state/Datahub alongside existing social champions, strategy intelligence, portal research and first-party evidence.

BG24 and downstream specialized generators should not independently query all raw Google/DataForSEO datasets. They should consume the compact shared content/SEO context already selected by BG09 or the shared Brain projection.

Blog/SEO generators may additionally use raw page-specific GSC/DataForSEO evidence when making a page-specific SEO decision, but shared Pattern context remains the cross-channel learning source.

## Content identity and lineage

Use a canonical `content_id` when present. Where legacy records lack it, derive lineage from existing page URL/slug/publication identifiers without destructive backfills.

Target lineage:

`evidence refs → signal/opportunity → content_id/page → decision/hypothesis → publication → social/search/site outcomes → Pattern → next generation decision`

No bulk schema migration is required for this first change.

## Cost rules

- deterministic reducer before AI;
- delta/materiality filter before BG168;
- dedupe before Notion/Make writes;
- no new fleet-wide polling;
- reuse existing schedules and current-state cache;
- no AI for empty/unchanged datasets;
- store compact Pattern summaries rather than repeatedly sending raw 28-day datasets to generators;
- measure credits per verified learning outcome, not raw run count.

## Failure handling

- Brain writeback failure must not destroy the local SEO outcome; keep the local measured evidence and leave a recoverable obligation.
- Max two identical retries per hypothesis.
- Never mark shared learning complete until BG168 write and BG167 projection are both verified.
- Duplicate fingerprint must resolve idempotently.
- OAuth/credential/permission changes remain a hard boundary.

## Implementation boundary

The first implementation should be the smallest safe extension to the existing BG87/BG168 path plus a regression contract proving that a material SEO outcome reaches shared Brain state and is visible to the content-strategy consumer.

Do not alter existing Google/DataForSEO ingestion unless evidence shows it is required.

## Verification

A candidate is green only when all of the following are proven:

1. an existing/non-destructive test fixture produces a material SEO outcome;
2. exactly one normalized PATTERN is routed to BG168 for that fingerprint;
3. BG166 persists the event or the existing router's expected durable learning record;
4. BG167 projects/acknowledges the Pattern in shared context;
5. BG09/shared content context can select or expose that SEO Pattern;
6. duplicate execution does not create duplicate learning;
7. unchanged/WAIT evidence does not create a new Pattern;
8. cost remains equal or lower per useful learning outcome after dedupe/materiality filtering;
9. existing social learning, SEO measurement and publishing routes remain green.

## Rollback

Rollback is configuration-only for this first change: remove/disable the new material SEO Pattern routing step and restore exact prior BG87 wiring. Existing local SEO measurements and all current production content flows continue unchanged.
