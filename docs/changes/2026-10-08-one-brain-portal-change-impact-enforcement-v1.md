# ONE BRAIN Portal V2 change impact enforcement v1

**Date:** 2026-10-08
**Obligation:** `one-brain-portal-change-evidence-20261008-v1`
**Source of truth:** existing authenticated Portal V2 state → canonical Supabase Brain authority. No new database, queue, AI agent or heartbeat.

## Existing state and repair

The existing Portal V2 impact engine calculated business impact and old dependency chains, and `createPortalDomainState` already wrote causal metadata to the existing Brain business-input endpoint. Two gaps prevented universal coverage:

1. Changes to a source page that did not modify a numerical formula or finding could report `changed:false`, causing no causal impact to be written. A newly added, removed, or modified connector/cloud setting is an example.
2. Pages whose IDs did not occur in legacy section bindings were not always mapped to their native source page. An unrecognized section could disappear without a review obligation.
3. A successful HTTP response with `stored:false` cleared the business-input queue without canonical acceptance evidence.

## New behavior

- Every page in `PORTAL_PAGE_INDEX` maps to itself, including CSRD, AI & cloud sovereignty, access, compliance and internal runtime/learning pages. Existing legacy camelCase bindings remain unchanged.
- Changed source values trigger evaluation even when computed KPIs remain stable. True no-ops do not count.
- Native dependency closure, existing organism graph, management/knowledge surfaces and cross-domain review rules produce a bounded list of affected pages and review domains. Actual legal applicability, financial value, sustainability measurement and cloud activation are **not** inferred.
- Unknown page paths return `mappingStatus: REVIEW_REQUIRED`; coverage is never claimed on missing mapping. An impact plan sets `externalExecutionAuthorized: false` and `evidenceStatus: OBSERVED_NOT_VERIFIED`.
- Existing `portal-business-input` persists `causalImpacts` in the existing canonical Brain input lineage, with mapping status, review domains, evidence class, and impact contract version.
- An unacknowledged `stored:false` causes a recoverable error and preserves pending work for retry rather than emitting misleading Brain synchronization.
- The existing Required test preflight runs the new page coverage, cross-domain, writeback and no-silent-green tests on every PR/merge group.

## Deliberate boundaries

- AI/cloud/CSRD transactionality for tenant data sovereignty is independently provided by the merged PR #4157; this change only addresses Portal V2 change-to-Brain propagation.
- New review domains are obligations to investigate, not assertions of compliance, execution, deployed AI infrastructure or measured environmental impact.
- GitHub merge, Supabase schema/Edge deployment, Netlify production and external commercial provider acknowledgments remain separate gates.
- No artificial success status, no posting without connector authorization, and no new cron/agent.

## Verification

Run `node --test portal-v2/tests/one-brain-impact-contract.test.mjs portal-v2/tests/portal-impact-engine.test.mjs portal-v2/tests/portal-causal-propagation.test.mjs portal-v2/tests/domain-state.test.mjs` and `node --test portal-v2/tests/*.test.mjs`. Production and external channel claims require separate source-aligned evidence after protected merge.
