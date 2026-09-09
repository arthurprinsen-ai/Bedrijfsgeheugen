# Content Learning Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Bedrijfsgeheugen content-learning loop so GA4, Buffer metrics, Notion post characteristics, attribution, Brain rules, AI generation and first-party campaign redirects share one canonical Supabase-backed learning contract without Make.

**Architecture:** Extend the existing Buffer/social-learning and growth/revenue infrastructure instead of creating a parallel system. Add deterministic adapters for GA4 and Notion characteristics, a fail-closed rule preflight consumed by content generation, and an opaque `/g/:key` redirect backed by canonical attribution state.

**Tech Stack:** Node.js 22 ESM, Netlify Functions, GitHub Actions, Supabase/Postgres, Google Analytics 4 Data API via Composio, Notion, node:test.

**Spec:** `docs/superpowers/specs/2026-09-09-content-learning-closed-loop-design.md`

## Global Constraints

- No Make dependency for new logic.
- Hans/Proposo is out of scope.
- Reuse the existing Supabase project and existing social/growth learning tables and ingest paths.
- Buffer remains the primary social-metric source.
- Do not create a second Brain or duplicate learning registry.
- AI generation must fail closed when the current valid rule snapshot cannot be loaded.
- `/g/:key` accepts only an opaque key; destination is never caller supplied.
- Unknown/expired/disabled redirect keys must not open-redirect.
- No secrets in repository content or logs.
- Existing BRAIN delivery, accepted-baseline and production-readback gates may not be weakened.

---

### Task 1: Canonical post enrichment contract

**Files:**
- Create: `lib/content-learning/post-features.mjs`
- Create: `tests/content-learning-post-features.test.mjs`
- Modify only the existing social/post ingest adapter discovered during implementation.

**Interfaces:**
- Consumes: canonical post identity fields (`postId`, `externalPostId`, `contentHash`, `publishedAt`, `platform`).
- Produces: `normalizePostFeatures(input)` returning canonical nullable feature keys: `hook_type`, `format`, `narrative_type`, `emotion`, `cta_type`, `topic`, `proof_type`, `campaign_key`, `notion_page_id`.

- [ ] Write failing tests proving aliases/empty values normalize deterministically and unknown values remain null rather than fabricated.
- [ ] Run `node --test tests/content-learning-post-features.test.mjs` and verify RED.
- [ ] Implement the minimal feature normalizer and merge it into the current post-import envelope without changing Buffer metric semantics.
- [ ] Re-run the feature test and affected social-learning tests; require PASS.
- [ ] Commit the independently testable enrichment contract.

### Task 2: GA4 daily observation adapter and import workflow

**Files:**
- Create: `lib/content-learning/ga4-observations.mjs`
- Create: `scripts/content-learning/ga4-daily-import.mjs`
- Create: `.github/workflows/ga4-content-learning.yml`
- Create: `tests/content-learning-ga4-observations.test.mjs`

**Interfaces:**
- Consumes: GA4 report rows with dimensions `date`, `pagePathPlusQueryString`, `sessionCampaignName` or the validated campaign dimension available on the property, and supported traffic/outcome metrics.
- Produces: deterministic CSV-compatible rows with `event_id`, `observed_at`, `campaign_key`, `page_path`, metrics and stable idempotency key, then submits those rows to the existing Supabase import/ingest surface.

- [ ] Write failing tests for GA4 string-number coercion, empty campaign handling, stable idempotency keys and CSV escaping.
- [ ] Run the GA4 unit tests and verify RED.
- [ ] Implement normalization and a CLI/import script that requires environment configuration and refuses silent partial imports.
- [ ] Add a daily GitHub Actions workflow using repository/environment secrets only; no credentials in YAML.
- [ ] Run unit tests and workflow/config validation; require PASS.
- [ ] Commit GA4 collection/import as a self-contained deliverable.

### Task 3: Notion post-characteristic adapter

**Files:**
- Create: `lib/content-learning/notion-post-features.mjs`
- Create: `scripts/content-learning/notion-post-feature-import.mjs`
- Create: `tests/content-learning-notion-features.test.mjs`

**Interfaces:**
- Consumes: Notion rows/properties corresponding to canonical content calendar records.
- Produces: canonical post identity + `normalizePostFeatures(...)` payload for the same existing Supabase post import surface.

- [ ] Write failing tests mapping actual Notion labels/aliases such as Hook type, CTA type, Media type/format and topic to canonical keys.
- [ ] Verify RED.
- [ ] Implement exact-property mapping with provenance (`source='notion'`, `notion_page_id`) and no inferred facts.
- [ ] Add idempotent import behavior keyed by canonical post identity and Notion page ID.
- [ ] Run tests plus Task 1 integration; require PASS.
- [ ] Commit Notion enrichment.

### Task 4: Brain rule snapshot and fail-closed generation preflight

**Files:**
- Create: `lib/content-learning/rule-preflight.mjs`
- Modify: the currently active AI/content-generation entrypoint(s) discovered in the repository.
- Create: `tests/content-learning-rule-preflight.test.mjs`

**Interfaces:**
- Consumes: Supabase/current Brain rules and learnings.
- Produces: bounded `ruleContext` with `snapshot_id`, `generated_at`, `expires_at`, positive rules, avoid rules, experiment allocation, evidence counts/confidence and feature winners/losers.
- `requireRuleContext(loader, options)` throws `CONTENT_RULE_CONTEXT_UNAVAILABLE` or `CONTENT_RULE_CONTEXT_STALE` instead of returning empty generic context.

- [ ] Write failing tests for valid snapshot, missing snapshot, stale snapshot and bounded context size.
- [ ] Verify RED.
- [ ] Implement snapshot validation and normalization.
- [ ] Wire it into active content-generation entrypoints before prompt/text construction; generation may not proceed on rule-read failure.
- [ ] Run targeted content-generation and rule tests; require PASS.
- [ ] Commit rule preflight.

### Task 5: First-party `/g/:key` attribution route

**Files:**
- Create: `netlify/functions/g-attribution-redirect.mjs`
- Modify: `_redirects`
- Create: `tests/content-learning-attribution-route.test.mjs`

**Interfaces:**
- Consumes: path key only.
- Resolves: key -> canonical destination/status from Supabase through server-side credentials.
- Records: campaign attribution through the existing growth ingest path before redirect where safe/idempotent.
- Produces: `302`/`303` to approved `https:` destination, `404` unknown key, `410` disabled/expired key.

- [ ] Write failing tests for valid redirect, unknown key, expired key, caller-supplied destination rejection, javascript/http scheme rejection and non-cacheable response.
- [ ] Verify RED.
- [ ] Implement resolver with allowlist/domain policy and existing growth ingest integration.
- [ ] Add `/g/:key  /.netlify/functions/g-attribution-redirect?key=:key  200!` in the correct redirects order.
- [ ] Run route/security tests and existing redirect/SEO tests; require PASS.
- [ ] Commit attribution route.

### Task 6: Closed-loop regression contract

**Files:**
- Create: `tests/content-learning-closed-loop.test.mjs`
- Modify: the narrowest existing content-learning CI workflow(s) so these tests run on PR and main.

**Interfaces:**
- Consumes: Task 1-5 public functions/contracts.
- Produces: executable proof that one canonical post can be enriched with Notion features, receive Buffer + GA4 observations, produce a rule snapshot, pass generation preflight and carry a campaign key into first-party attribution.

- [ ] Write the integration test first and verify it fails if any bridge is absent.
- [ ] Implement only missing glue required by the test; do not duplicate stores.
- [ ] Run all new content-learning tests plus current Buffer/social-learning tests.
- [ ] Run repository-required targeted and baseline gates for the changed paths.
- [ ] Commit the closed-loop regression gate.

### Task 7: PR, production promotion and evidence

**Files:**
- No new behavior unless a release defect is found; any defect must receive a regression test before fix.

**Interfaces:**
- Produces: exact candidate SHA, PR, green required checks, promoted main SHA, exact Netlify deploy identity, production route/function readback, and material outcome writeback.

- [ ] Run BRAIN chat-learning preflight and exact changed-scope test suite.
- [ ] Open PR from `feat/bg-content-learning-closed-loop` to `main` with scope and evidence.
- [ ] Wait only through available synchronous checks; if a check exposes a defect, fix cause on the branch and re-run.
- [ ] Merge only when required checks for the exact candidate SHA are green and existing delivery authority allows promotion.
- [ ] Verify Netlify production deploy corresponds to the promoted SHA.
- [ ] Perform controlled production readback for `/g/:key` and relevant functions without creating a real customer-side effect.
- [ ] Write the material release outcome back through the existing Brain ledger/context path.
- [ ] Claim production only when exact-SHA/deploy/readback evidence exists.
