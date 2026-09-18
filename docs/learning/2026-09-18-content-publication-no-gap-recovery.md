# Production learning — no-gap daily content publication

Date: 2026-09-18  
Status: production verified  
Scope: LinkedIn personal, LinkedIn company, Instagram, blog

## Outcome

The daily publication obligation for 2026-09-18 reached terminal production truth on all four required channels.

- LinkedIn personal: `LIVE_PROVEN`
- LinkedIn company: `LIVE_PROVEN`
- Instagram: `LIVE_PROVEN`
- Blog: `LIVE_PROVEN`
- Daily Powerhouse run: `completed`
- Publication proof: 4 expected / 4 terminal / 0 blockers
- Blog public URL: `https://www.bedrijfsgeheugen.nl/blog/instagram-groeikalender-v2-hoe-mira-dagelijks-scoort-tot-31-12-2026/`
- Blog public readback: HTTP 200 + exact `data-content-id` marker
- Blog protected merge evidence: PR #2006 / merge `d6dac2565c74815658305fad807f045a5fb844f2`
- Renderer recovery: PR #2009 / tested head `e172992a7ab70853b9d8c493b258e76e7e89acab` / main `b95bcfd244e51be9320271c82525366195d258d0`

## Incident

The daily content system had valid obligations and generated content, but execution was not guaranteed end-to-end.

Four independent defects were exposed during recovery:

1. The social publisher assumed a PostgREST relationship between `powerhouse_channel_decisions` and `powerhouse_content_artifacts` that does not exist.
2. Instagram pre-publish evidence did not carry the exact final asset/hook fields expected by the identity/quality gate, and the Buffer image post used an invalid Instagram PostType enum.
3. The blog critical path still depended on an old Notion approved-blog datasource that no longer exists.
4. After the blog renderer moved from `scripts/` to `tools/site-shell/`, its repository-root derivation still used the old `__file__` depth and looked for templates under `tools/blog/`.

## Root cause

The common failure pattern was treating a valid intermediate state as sufficient:

- content generated != published;
- scheduler present != execution;
- provider request accepted != provider truth;
- merge/deploy started != public live proof;
- path move != executable path contract preserved.

The daily system must therefore close the full loop from canonical artifact to public/provider readback.

## Permanent rules

### `content-publication-supabase-first-blog-v1`

Powerhouse/Supabase artifacts are the canonical blog source of truth. Notion may be a projection or work surface, but it is not a critical delivery dependency.

Canonical path:

`Supabase artifact -> protected GitHub candidate -> Required/BRAIN gates -> protected merge -> Netlify production -> public marker readback -> LIVE_PROVEN`.

### `publisher-move-root-contract-v1`

Moving an executable publisher/renderer requires validation of its repository root and every template/output path from the new `__file__` location. The move is not complete until the canonical artifact can be rendered from the new location.

A regression test now imports the renderer without executing publication and asserts that:

- `ROOT` resolves to the repository root;
- the article template exists;
- the blog index exists;
- the RSS file exists;
- the sitemap exists.

### `publication-live-proof-terminal-truth-v2`

Only `LIVE_PROVEN` is terminal publication truth.

The following are recoverable incomplete states: `PLANNED`, `GENERATED`, `content_ready`, queued, scheduled, provider-request accepted, merge-only, deploy-started, or sent without required identity/public proof.

The daily run may become green only when every required channel is terminal and deduplicated.

## Operational prevention

- Social publication uses provider readback and exact channel identity.
- Instagram requires exact final-media proof before dispatch.
- Blog no longer depends on the removed Notion datasource.
- Daily blog delivery is started early enough to meet the 08:00 Europe/Amsterdam publication SLO.
- The five-minute supervisor remains the recovery mechanism for incomplete publication state.
- Generated daily blog candidates carry canonical delivery metadata automatically.
- Global diagnostic audits remain evidence signals; changed-path Required/BRAIN/browser/page-SEO gates are release-authoritative for a bounded candidate.
- No duplicate artifact is regenerated merely because delivery or readback is temporarily incomplete.

## Powerhouse writeback

The incident is persisted in canonical runtime state:

- `social_learnings`: three `PROVEN` fingerprints.
- `brain_delivery_evidence`: three GREEN evidence records.
- `content_publication_obligations`: all four channels `LIVE_PROVEN` with `learned_at` and learning fingerprints.
- `powerhouse_daily_runs`: root causes, terminal truth and prevention fingerprints recorded under `content_publication_learning`.

The learning is therefore both operationally active and versioned for future agents and maintainers.
