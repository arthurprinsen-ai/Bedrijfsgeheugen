# Powerhouse Engineering OS v1 — Design

Fingerprint: `powerhouse-engineering-os-v1`

## Purpose
Bedrijfsgeheugen Powerhouse must let current and future agents develop, test, release, verify and learn faster without creating parallel truths, duplicated workflows or undocumented platform behavior. This design consolidates the existing Agent Development Contract, Development Operating System and BRAIN-DELIVERY-v2 into one executable engineering contract.

## Existing-state decision
This is not a new delivery platform. Existing authorities remain authoritative:
- `AGENTS.md`: agent behavior and hard boundaries;
- `config/brain-delivery-system.json`: delivery/lane/promotion authority;
- `docs/development-operating-system.md`: canonical execution sequence;
- `docs/development-ledger.md` and existing Brain writeback: errors, recovery and learning lineage;
- GitHub protected `main` + Required `test`: merge authority;
- Netlify: website/portal preview and production runtime;
- Supabase migrations/config/functions: database/runtime source control;
- Notion: human-readable knowledge/audit projection, never deployed identity;
- Buffer/provider readback: channel outcome evidence, never engineering source of truth.

## Golden path
Every material engineering change follows:

`CONTEXT -> SCOPE -> PLAN -> CHANGE -> TEST -> PREVIEW -> VERIFY -> PROMOTE -> PROD_READBACK -> WRITEBACK -> LEARN`

An agent must be able to answer before changing anything: what exists, where authority lives, which component/lane owns the change, what prior failures/learnings match, which gates apply, how rollback works, and what evidence closes the outcome.

## Machine-readable contract
`config/powerhouse-engineering-os.json` records the stable engineering invariants, platform authorities, quality dimensions, terminal statuses and mandatory artifacts. It is a contract index, not a second registry: referenced component/delivery details stay in their existing canonical files.

`scripts/brain/powerhouse-engineering-os.mjs --check` performs a fail-closed bootstrap validation. It checks that canonical authorities exist, that Development OS is on `BRAIN-DELIVERY-v2`, and that the Engineering OS regression test is wired into Required test. `--packet` emits the bounded engineering contract for agents. Both validator and regression test live inside already-registered Brain delivery lanes; the delivery classifier is not broadened for this capability.

## Quality model
The engineering quality envelope covers, where relevant to changed scope:
- correctness and functional regression;
- formatting/lint/type/static syntax;
- contract/API/schema compatibility;
- unit, integration, E2E and production readback;
- frontend visual/layout/responsive/cross-browser/accessibility/performance/console/network/content-design-system drift;
- backend performance, concurrency/idempotency, migration/data integrity, security/RLS/auth, failure recovery and cost/capacity;
- supply-chain/dependency provenance, pinned versions/deprecation/EOL where applicable;
- observability, rollback/recovery and exact candidate identity;
- human-readable documentation plus machine learning/error/outcome writeback.

Checks are change-scoped and evidence-driven: do not run unrelated expensive suites merely for ceremony, but never omit a gate required by declared scope/dependencies.

## Preview and promotion
GitHub PR/agent work uses the existing preview-first release path. Netlify Deploy Previews are the default isolated web review surface. Immutable deploy identity/permalink is preferred for final evidence instead of guessed/transient aliases. Supabase schema/config/function changes remain migration/source-control driven and may use isolated preview branches where configured. Production promotion remains owned by the existing BRAIN delivery authority and protected branch rules.

## Clean-code rules
- Existing-state-first and reuse-first before adding capabilities.
- Small coherent modules with explicit interfaces and ownership.
- No copy/paste workflow families when a reusable/composable workflow or helper already exists.
- No hidden dashboard-only production schema changes; migrations/source control remain reconstructable authority.
- No magic scores, undocumented thresholds or undocumented deployment behavior.
- No new queue, registry, brain, analytics store, calendar or learning store when an existing canonical capability can be extended.
- Tests assert behavior/evidence rather than brittle marketing copy or incidental implementation text.
- A new test is not protection until CI demonstrably executes it.
- Exact tested candidate identity is part of acceptance.

## Documentation and learning
Documentation is an output of delivery, not deferred cleanup. Structural changes update the existing human handbook/System Map/Master Register projection where relevant. Incidents and unsuccessful approaches write root cause, evidence, fix and prevention back to the existing Brain lineage. New agents consume those learnings before trying new hypotheses.

## Terminal states
Only these hard states may conclude relevant work:
- `LIVE & BEWEZEN`: exact intended production outcome and writeback are verified;
- `DEELS LIVE`: observational interim state only; agent continues where technically possible;
- `GEBLOKKEERD`: objective hard boundary with evidence, deduplicated obligation and executable next action;
- `NIET GEDAAN`: no production claim.

## Acceptance criteria
1. Engineering OS contract exists and validates successfully.
2. Development OS references this contract and uses BRAIN-DELIVERY-v2 only.
3. Required `test` executes `tests/brain-powerhouse-engineering-os-contract.test.mjs`.
4. The regression contract fails on contract/version/wiring drift.
5. No existing delivery authority is replaced, bypassed or duplicated.
6. PR passes protected Required test before merge.
7. After merge, exact-main runtime/readback and canonical documentation/learning writeback are required before `LIVE & BEWEZEN`.
