# Control Plane Diet — GitHub, Netlify, Supabase & Notion

**Date:** 2026-10-06  
**Status:** Design approved in chat; written specification awaiting review  
**Repository:** arthurprinsen-ai/Bedrijfsgeheugen

## 1. Goal

Reduce development and delivery latency by simplifying the control plane instead of adding more control-plane machinery.

The target state is a small, observable, deterministic delivery system with:

- one fast PR admission path;
- one immutable build artifact per source/toolchain hash;
- one canonical writer per provider/domain;
- bounded active infrastructure objects;
- explicit lifecycle and TTL for temporary resources;
- event-driven backend execution instead of chains of polling orchestrators;
- human documentation projected from canonical machine state rather than acting as runtime state;
- fail-fast readback based on exact identity and hashes rather than repeated full-stack re-proving.

The optimization target is not only compute time. The primary target is total engineering lead time, including queue time, duplicated CI, stale recovery work, branch drift, repeated provider readbacks and agent wait loops.

## 2. Current measured state

Read-only audit on 2026-10-06 found:

### GitHub

- 126 workflow files under `.github/workflows`.
- Approximately 668 KB of workflow YAML.
- 78 open pull requests returned by the repository search.
- Large numbers of open PRs are stale, superseded or unmergeable.
- Multiple PRs contain successor/supersession language, indicating delivery-lineage churn.
- Existing workflow names reveal overlapping responsibilities: Required, multiple CodeQL paths, multiple production/readback paths, repository-writer supervision, recovery supervisors, hygiene/janitors, numerous domain-specific tests and shadows.

### Netlify

16 projects exist in the connected account.

Relevant Bedrijfsgeheugen-related observations:

- `bedrijfsgeheugen` is the production site.
- `bg-portaal-bronsync` is a separate Bedrijfsgeheugen-related site.
- 3 sites are explicitly named `archive-*`.
- 8 sites use generated/random names such as `fascinating-kataifi-09fd89` and `dashing-faun-ad16d3`.

These are evidence of missing lifecycle/TTL enforcement for temporary deployments and experiments.

### Supabase

The active production project is `adhjwmvyoixzjtmiroln`.

Measured state:

- 115 active Edge Functions.
- 591 migration records.
- high deployment-version churn in several functions, e.g.:
  - `powerhouse-social-publisher`: version 126;
  - `bg-notion-sync`: version 40;
  - `powerhouse-content-orchestrator`: version 40;
  - `powerhouse-content-loop`: version 31;
  - `powerhouse-predictive-engine`: version 30.
- performance advisor:
  - 10 unindexed foreign keys;
  - 127 unused indexes;
  - 3 duplicate indexes;
  - 1 auth connection configuration advisory.
- security advisor:
  - 156 RLS-enabled tables without policies;
  - 8 security-definer view errors;
  - 4 mutable function search paths;
  - 1 materialized view exposed through API;
  - 22 anonymous executable security-definer function warnings;
  - 22 authenticated executable security-definer function warnings.

### Notion

The connected workspace contains:

- 374 top-level private items;
- 368 pages;
- 6 databases;
- only 45 titled top-level items;
- 329 untitled top-level items.

This is evidence of a missing information lifecycle and causes search, navigation and synchronization entropy.

## 3. Architectural principles

### 3.1 One source of truth per state class

Each category has one canonical authority:

- Git source, tests, delivery policy: GitHub.
- Production web deployment: Netlify.
- Operational database/runtime truth: Supabase.
- Human-readable planning and reference: Notion.
- Cross-system status: derived projection, never an independent authority.

No state may make a round trip such as:

`GitHub -> Supabase -> Notion -> Supabase -> GitHub`

unless the round trip is a deliberate business workflow with an explicit ownership contract.

### 3.2 One canonical writer per provider/domain

Each external side-effect class has exactly one writer.

Examples:

- Netlify production deployment: one deployment authority.
- Supabase production schema: one migration authority.
- Supabase Edge deployment: one deployment authority.
- LinkedIn/Instagram publication: one social publisher authority.
- Notion projection: one sync authority.

All other components request work or produce evidence. They do not write directly.

### 3.3 Build once, prove once, deploy many

For any source SHA:

`artifact_id = sha256(source_manifest + lockfile + toolchain_manifest + build_contract_version)`

The build pipeline produces:

- immutable deployable artifact;
- manifest;
- test/evidence bundle;
- checksums;
- provenance metadata.

Downstream release jobs consume that artifact. They do not rebuild the source unless the artifact is unavailable or fails provenance validation.

Production readback verifies identity:

`source SHA -> artifact hash -> provider deploy id -> live response hash/version`

It must not re-run the full CI suite.

### 3.4 No polling when an event exists

When GitHub, Netlify, Supabase or an internal queue can emit a deterministic event, polling is prohibited.

Polling is reserved for provider APIs that genuinely lack event delivery and must have:

- bounded attempts;
- bounded total wall-clock duration;
- exponential backoff;
- deterministic terminal state;
- no recursive recovery chain.

### 3.5 Lifecycle is part of architecture

Every generated infrastructure object must have one of:

- permanent;
- active;
- ephemeral with expiry;
- archived;
- delete-candidate.

Ephemeral resources require a TTL at creation time.

### 3.6 Architecture budgets are code

The repository must enforce upper bounds that prevent control-plane inflation.

Initial budgets:

- top-level GitHub workflow triggers: <= 15;
- open implementation/recovery PRs: <= 10;
- one live PR per obligation;
- active Bedrijfsgeheugen Netlify projects: <= 5;
- active Supabase Edge Functions: <= 40;
- Notion private root items: <= 50;
- successor depth for one obligation: <= 1;
- repeated identical source-hash deployments: <= 2 in 30 minutes;
- polling chain wall-clock budget: <= 120 seconds unless explicitly allowlisted.

Budgets are fail-closed for new additions but do not require unsafe mass deletion to become effective.

## 4. GitHub target architecture

### 4.1 Top-level workflows

The target top-level workflow set is:

1. `required.yml`
2. `merge-gate.yml`
3. `release.yml`
4. `nightly.yml`
5. `security.yml`
6. `content.yml`
7. `ops.yml`
8. `dependency-update.yml`
9. `manual-recovery.yml`
10. optional provider-specific release dispatcher if isolation is required

All reusable logic lives under reusable `workflow_call` workflows or scripts, but reusable workflows may not independently trigger on `pull_request`.

### 4.2 PR admission path

`required.yml` must target p95 <= 60 seconds and hard ceiling <= 120 seconds under normal GitHub runner availability.

It performs only:

- exact-head identity;
- branch/lease hygiene;
- changed-path classification;
- syntax/lint/type checks;
- small deterministic unit/contract tests affected by changed paths;
- lightweight secret/static safety checks;
- architecture-budget check.

It must not:

- deploy to providers;
- run full browser suites;
- run full Supabase parity/readback;
- rebuild the website multiple times;
- poll other workflows;
- create successor PRs.

### 4.3 Merge gate

Heavy assurance runs at merge time, preferably `merge_group`, including:

- full tests;
- browser assurance;
- CodeQL/security;
- Netlify build parity;
- Supabase migration/function contract checks;
- integration tests.

This gate may reuse artifacts from Required where provenance permits.

### 4.4 Release

Release consumes the immutable merge artifact and deploys exactly once.

Post-deploy verification is identity/readback only.

### 4.5 PR lifecycle

A central PR janitor classifies every open PR:

- CURRENT
- SUPERSEDED
- STALE
- BLOCKED
- ARCHIVE

Rules:

- exactly one CURRENT PR per obligation;
- if a replacement is required, the previous PR is closed before or atomically with successor activation;
- zero-overlap main movement updates the same lineage where safe;
- stale unmergeable historical PRs are closed with a machine-readable reason;
- no agent may create a successor merely because a check is queued.

### 4.6 Control-plane churn circuit breaker

For one obligation, stop automated mutation and force diagnosis when:

- successor depth > 1;
- more than 3 head rewrites occur without semantic source change;
- the same failure signature recurs twice after a repair;
- the same artifact hash is rebuilt more than twice;
- more than one recovery controller claims ownership.

The breaker produces one diagnostic record, not another repair PR.

## 5. Netlify target architecture

### 5.1 Site classes

Every Netlify project is classified:

- PROD
- ACTIVE_NONPROD
- EPHEMERAL
- ARCHIVE
- DELETE_CANDIDATE

`bedrijfsgeheugen` remains the production authority.

The audit must determine whether `bg-portaal-bronsync` is still required as a separate runtime. If not required, its functionality is consolidated into the production deploy graph before retirement.

### 5.2 Ephemeral environments

Temporary preview/test sites must be replaced by one of:

- standard deploy previews on the production site;
- branch deploys;
- explicitly created ephemeral projects with TTL.

Default TTL: 7 days.

A Netlify janitor removes expired ephemeral projects only after checking:

- no custom domain;
- no production alias;
- no active dependency;
- no currently open PR references the project;
- no release contract references the site id.

### 5.3 Build reuse

Preferred path:

GitHub build -> immutable artifact -> Netlify deploy upload.

If Git-based Netlify builds remain necessary, Netlify must still consume deterministic caches and skip unchanged scopes.

There may be only one production build authority.

### 5.4 Cache policy

- fingerprinted static assets: immutable one-year browser/CDN cache;
- dynamic public reads: explicit CDN caching where safe;
- stale-while-revalidate for expensive public projections;
- cache keys must be bounded and intentional;
- deployment proof may never depend on stale cached content.

## 6. Supabase target architecture

### 6.1 Domain consolidation

115 active Edge Functions are reduced toward 25–40 domain-level functions.

Target domains:

1. Brain / operating authority
2. Content
3. Social
4. Commercial / revenue
5. Portal / product API
6. Operations / integration
7. limited provider callbacks/webhooks

Tiny internal functions that exist only to sequence another function become modules behind a domain gateway or queue worker.

### 6.2 Event-driven jobs

Background work uses database queues and scheduled dispatch where appropriate.

Preferred model:

`producer -> durable queue row -> worker claim -> short transaction -> side effect -> evidence -> terminal state`

Use `FOR UPDATE SKIP LOCKED` or equivalent safe claim semantics for concurrent workers.

Avoid chains of HTTP Edge Function calls for internal orchestration when durable database state can coordinate the work.

### 6.3 Edge Function lifecycle

Each Edge Function receives metadata in source control:

- owner domain;
- public/internal;
- writer/read-only;
- authentication mode;
- last known caller(s);
- deprecation status;
- replacement;
- deletion-after date if deprecated.

Deletion is allowed only when telemetry/source search shows no callers and the replacement is production-proven.

### 6.4 Database schema

Do not rewrite the 591-item production migration history.

Instead:

- production history remains immutable;
- new environments may use a generated baseline/snapshot plus later migrations if supported by the project workflow;
- future migrations remain small and reversible where practical;
- temporary repair migrations are prohibited from becoming permanent architecture.

### 6.5 Index cleanup

Perform evidence-based cleanup:

1. remove exact duplicate indexes;
2. add missing foreign-key indexes where query patterns justify them;
3. inspect unused indexes over a representative observation period before removal;
4. use `pg_stat_statements` / explain plans for high-impact queries;
5. vacuum/analyze after significant index changes where needed.

No mass deletion based only on an advisor snapshot.

### 6.6 Security debt

Performance work must not weaken security.

The cleanup includes:

- resolve 8 security-definer view errors;
- fix 4 mutable function search paths;
- review/revoke unnecessary execution of security-definer functions;
- review the materialized view exposed to the API;
- classify the 156 RLS-without-policy tables:
  - service-only/internal and intentionally inaccessible;
  - user-facing and missing policies;
  - deprecated/delete-candidate.

For service-only tables, the desired inaccessible posture must be documented rather than adding permissive policies to silence a lint.

## 7. Notion target architecture

### 7.1 Root structure

Private root target:

1. Strategy & Research
2. Product & Technology
3. Content & Marketing
4. Sales & Relationships
5. Operations
6. Archive

Existing useful hubs may be renamed/mapped instead of recreated.

### 7.2 Untitled-page cleanup

329 untitled top-level pages are not deleted blindly.

They are classified by:

- content hash/signature;
- creation/edit recency;
- inbound links;
- database relation references;
- sync-source metadata;
- duplication similarity;
- ownership/source process.

Then they are:

- titled and moved to a canonical hub;
- consolidated into a parent;
- archived;
- deleted only if proven duplicate/empty and unreferenced.

### 7.3 Runtime rule

Notion is not runtime state.

Machine execution must not block on Notion unless the business process explicitly requires human approval recorded there.

`bg-notion-sync` becomes one-way projection wherever possible:

canonical machine state -> Notion

Inbound Notion events are limited to explicit human-authored control objects.

## 8. Shared evidence architecture

All delivery layers write a compact evidence envelope:

```json
{
  "obligation_id": "...",
  "source_sha": "...",
  "artifact_hash": "...",
  "contract_version": "...",
  "provider": "...",
  "provider_object_id": "...",
  "started_at": "...",
  "completed_at": "...",
  "result": "pass|fail",
  "proof": {}
}
```

A downstream step reads the previous envelope rather than re-running upstream checks.

Evidence is content-addressed and immutable.

## 9. Observability and SLOs

The system must measure:

- PR admission p50/p95;
- merge-gate p50/p95;
- queue delay;
- runner execution time;
- number of workflow runs per source SHA;
- rebuild count per artifact hash;
- deploy count per provider per SHA;
- successor count per obligation;
- active PR count;
- Edge Function call volume and zero-call candidates;
- Netlify temporary project age;
- Notion root-item count;
- provider mutation retries;
- time spent polling.

Initial SLOs:

- PR admission p95 < 60s; hard normal ceiling 120s.
- One top-level PR workflow run per head SHA.
- Zero duplicate provider deploys for identical artifact hash.
- Production release readback < 30s when providers are healthy.
- No automated workflow may poll another workflow for >120s.
- Historical cleanup work must never block feature PR admission.

## 10. Implementation phases

### Phase A — Freeze inflation and instrument

- add architecture-budget report;
- add artifact/evidence identity contract;
- add churn circuit breaker;
- prevent new top-level PR triggers without explicit allowlist;
- inventory active callers/trigger frequency before deletion.

### Phase B — GitHub consolidation

- collapse PR triggers into `required.yml`;
- convert domain tests to reusable workflow calls/scripts;
- move heavy assurance to merge gate;
- retire duplicate CodeQL/readback/recovery triggers;
- classify and close stale/superseded PRs;
- enforce one live PR per obligation.

### Phase C — Build-once release

- produce immutable build artifact;
- reuse artifact across merge/release;
- deploy exact artifact to Netlify;
- replace repeated production rebuild/readback with hash/identity proof.

### Phase D — Netlify cleanup

- classify all 16 sites;
- verify dependencies;
- retire confirmed archive/random test sites;
- introduce preview TTL janitor;
- consolidate Bedrijfsgeheugen runtime where safe.

### Phase E — Supabase consolidation

- introduce function registry and caller telemetry;
- identify no-call/deprecated functions;
- consolidate internal orchestration;
- introduce durable queue workers;
- fix duplicate indexes and high-confidence database debt;
- resolve security advisor errors/warnings according to intended access.

### Phase F — Notion cleanup

- build six-root information architecture;
- classify 329 untitled root pages;
- move/archive/dedupe safely;
- reduce runtime sync to one-way projection.

### Phase G — Enforce budgets

- turn observed budgets into blocking architecture tests;
- add weekly janitor report;
- block any new control-plane object without owner + expiry/lifecycle metadata.

## 11. Safety invariants

The implementation must preserve:

- protected main;
- exact-head verification;
- required security scanning;
- production provider single-writer rules;
- no manual bypass of protected merge;
- source/provider parity evidence;
- no destructive database cleanup without dependency proof;
- no Netlify project deletion with custom-domain or active-reference risk;
- no Notion deletion without empty/duplicate/unreferenced proof;
- no broad permissive RLS policy merely to silence advisor output;
- no production secret exposure.

## 12. Definition of done

The initiative is complete only when:

- GitHub top-level independently triggered workflows are <= 15;
- ordinary PRs produce one admission workflow only;
- open implementation/recovery PRs are <= 10;
- every obligation has at most one live PR;
- production build is artifact-reused instead of rebuilt;
- production release readback proves artifact/provider/live identity;
- Netlify Bedrijfsgeheugen footprint is <= 5 active projects;
- temporary Netlify environments have enforced TTL;
- Supabase active Edge Functions are <= 40 or each exception has a documented owner/caller justification;
- duplicate indexes are removed and missing-FK index decisions are documented;
- Supabase security ERROR findings are zero and WARN findings are explicitly resolved or accepted with rationale;
- Notion private root is <= 50 items and the six-root structure is active;
- architecture budgets prevent regression;
- p95 PR feedback and release latency are measured continuously.

## 13. Non-goals

This initiative does not:

- rewrite application business logic for aesthetic reasons;
- replace Supabase, Netlify, GitHub or Notion;
- weaken security or release gates to make metrics green;
- rewrite historical production migrations;
- delete live resources solely because they appear unused in one snapshot;
- introduce a new orchestration product merely to coordinate the existing orchestration products.

## 14. Preferred implementation order

The order is intentional:

1. Freeze control-plane growth.
2. Consolidate GitHub PR admission.
3. Establish immutable artifact reuse.
4. Simplify Netlify deployment.
5. Consolidate Supabase execution.
6. Clean Notion information architecture.
7. Make architecture budgets blocking.

This sequence generates speed early while preserving rollback and observability for later destructive cleanup.
