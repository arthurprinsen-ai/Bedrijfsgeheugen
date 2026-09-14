# Unified Content Calendar & Publication Operations Design

## Goal

Create one canonical content operation for Bedrijfsgeheugen that makes every planned content action visible from planning through learning. From 14 September through 31 December 2026 every calendar day has a blog publication obligation, while LinkedIn personal, LinkedIn company and Instagram are represented in the same daily operation.

The system must answer, per date and channel: what is planned, what was generated, what was approved, what was dispatched, what was published, whether it is live-proven, where it was published, what the measured outcome was, and what the next action is.

## Existing systems to reuse

- `social_experiments` is the canonical adaptive content calendar. It already reserves a daily experiment through 31 December 2026 and stores recipe, source signals, commercial hypothesis and target channels.
- `powerhouse-runtime/daily` is the existing daily decision/learning runtime. It aggregates revenue, social, SEO and runtime evidence and creates content recommendations.
- `social_posts` and `bg_post_kenmerken` form the measured social/content learning chain.
- Buffer remains the social publication/measurement lane and channel identity rules stay fail-closed.
- `approved-central-blog.yml` and `publish_approved_blog_v2.py` remain the only blog rendering/delivery lane. Blog delivery continues through candidate PR, BRAIN delivery/BG169, Netlify and public proof. No direct push to `main` is introduced.
- Existing native daily schedulers are reused. No separate parallel calendar is introduced.

## Canonical daily channel set

For the canonical Bedrijfsgeheugen tenant the daily calendar exposes these channels:

1. `linkedin_personal`
2. `linkedin_company`
3. `instagram`
4. `blog`

The calendar stores experiment intent and adaptive recipe, not frozen copy. Copy may change up to publication time based on the newest learnings, while the obligation to publish/measure remains stable.

## Operational publication ledger

A new `content_publication_obligations` table is an execution ledger, not a second calendar. Each row references the calendar by `tenant_id`, `experiment_id` and `publication_date`, and identifies one channel obligation.

Primary key: `(tenant_id, publication_date, channel)`.

Required state fields:

- `status`: `PLANNED`, `GENERATED`, `APPROVED`, `DISPATCHED`, `PUBLISHED`, `LIVE_PROVEN`, `MEASURED`, `LEARNED`, `BLOCKED`, `FAILED`
- `content_kind`: `social` or `blog`
- `content_id`, `slug`, `external_id`, `canonical_url`
- timestamps for generated, approved, dispatched, published, live-proven, measured and learned
- `last_error`, `recovery_attempts`, `evidence`, `metrics`, `next_action`

No row may become `LIVE_PROVEN` solely because a workflow completed. Proof requires a canonical URL/external destination plus explicit live evidence.

## Calendar invariant

The range 2026-09-14 through 2026-12-31 contains exactly 109 dates. The canonical tenant must therefore have exactly 109 blog obligations in that range, one per date, with no duplicates.

An idempotent sync function projects `social_experiments.target_channels` into the obligation ledger. It is safe to run repeatedly and updates calendar linkage without erasing execution state.

The same sync adds `instagram` to the canonical daily target channel set. This fixes the current gap where the central experiment calendar has LinkedIn personal, LinkedIn company and blog but not Instagram.

## Daily orchestration

`powerhouse-runtime/daily` remains the daily intelligence entry point. As part of a run it:

1. syncs the current calendar date into publication obligations;
2. reads the day's obligations;
3. records the best current cross-channel recommendations and experiment context;
4. returns a compact `contentOperations` block with channel status and next action.

This does not itself bypass Buffer or GitHub publication lanes.

## Automatic blog dispatch

The existing `approved-central-blog.yml` gets its own daily schedule because it is the existing blog publisher, not a new parallel publisher. On scheduled execution it first selects one exact eligible due slug from the approved queue. The selection is deterministic and fail-closed: only rows already marked Approved central article, Pending, Autopublish allowed, Quality gate Passed, Review Approved and publication date due may be considered.

The selected exact slug is then passed into the existing renderer, preserving its exact-slug contract. The renderer continues to reject missing/incomplete snapshots, duplicate slugs, altered source hashes and more than two dispatch attempts.

If no eligible blog is due, the workflow records/raises an unmet publication obligation rather than pretending success. A scheduled recovery pass may retry only when the same day's obligation is still not `LIVE_PROVEN`, respecting the existing maximum dispatch attempt contract.

A blog is not considered complete when the candidate PR is opened. Final state progression is driven by production/public proof after BG169/Netlify delivery.

## Social publication and measurement

Social publication remains Buffer-first. Buffer/post collectors continue writing `social_posts`; the existing trigger maps posts to the experiment by Europe/Amsterdam publication date and records creative features.

The operational ledger is reconciled from observed posts and their proof/metrics. LinkedIn personal, LinkedIn company and Instagram therefore use the same state vocabulary as blog without duplicating Buffer data.

## Unified read model

Create `content_operations_cockpit`, a view intended for the Powerhouse/Portal UI and runtime endpoint. Per date/channel it returns:

- date
- experiment/family/decision mode
- channel and content kind
- status
- `is_due_today`, `is_overdue`
- content/slug/external destination/canonical URL
- last error and recovery count
- metrics/evidence
- next action
- timestamps

The runtime exposes this through a read-only `content-operations` route, defaulting to a practical date window and optionally accepting `from`, `to` and `channel` filters.

## Closed-loop learning

`MEASURED` and `LEARNED` are distinct from `LIVE_PROVEN`. Publication proof closes delivery; outcome evidence closes measurement; incorporated learning closes the feedback loop.

Existing social/revenue learnings, Search Console/SEO signals, site analytics, Buffer metrics and sales outcomes remain the source evidence for next-day recommendations. The ledger links these outcomes back to the calendar experiment rather than becoming a new analytics store.

## Error handling and recovery

- Missing calendar date: fail closed and surface `BLOCKED`/next action.
- Missing approved blog candidate: surface an overdue blog obligation; never fabricate or auto-approve content.
- Publication workflow failure: store evidence/error and keep obligation incomplete.
- Duplicate dispatch: prevented by unique ledger keys, source-hash sealing, existing slug checks and max-attempt rules.
- Channel identity mismatch: existing channel identity gate remains authoritative.
- No production proof: never report a content item as live.

## Tests / release gates

1. Contract test proves 109 blog obligations for 2026-09-14 through 2026-12-31.
2. Contract test proves all canonical calendar rows include LinkedIn personal, LinkedIn company, Instagram and blog.
3. Idempotency test proves re-sync creates no duplicate obligation rows.
4. State-machine test rejects invalid regression from live/measured states to planned.
5. Blog selector test proves only eligible due approved rows can be selected and an exact slug is always passed to rendering.
6. Runtime contract test proves `contentOperations` is returned from daily and via the read endpoint.
7. Existing repo-writer/BRAIN delivery gates remain required.
8. Production completion requires live readback evidence; branch/PR success alone is not production proof.
