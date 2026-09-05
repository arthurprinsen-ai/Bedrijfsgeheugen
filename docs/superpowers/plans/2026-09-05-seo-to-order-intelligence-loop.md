# SEO-to-Order Intelligence Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak de bestaande SEO Order Engine tot een gesloten, privacybewuste SEO→gedrag→lead/order→Brain→verbetering-loop die alle bestaande publieke pagina's en toekomstige blogs automatisch onder hetzelfde contract brengt.

**Architecture:** De bestaande `tools/seo-order-engine/` blijft de enige website-SEO bron van waarheid. Een nieuwe growth-observation laag normaliseert onsite events en zoekdata naar één schema, levert die via de bestaande BG211 universele eventarchitectuur aan DataHub/Brain, en laat alleen allowlisted, evidence-safe optimalisatiekandidaten terugstromen naar de bestaande GitHub/Netlify releaseketen.

**Tech Stack:** Node.js 24 ESM, statische HTML/JS, JSON contracts, Netlify Functions, GitHub Actions, bestaande Powerhouse BG211/BG168/BG166/BG167/BG205 architectuur.

**Spec:** `docs/superpowers/specs/2026-09-05-seo-to-order-intelligence-loop-design.md`

## Global Constraints

- Alle interne HTML-links die worden gegenereerd zijn volledige `https://www.bedrijfsgeheugen.nl/...` URLs.
- Geen persoonsgegevens in SEO/growth learning events.
- Geen verzonnen klantresultaten, prijzen, reviews, keurmerken of bewijs.
- Geen autonome publicatie van nieuwe feitelijke claims zonder evidence.
- BG211 blijft de universele producer-adapter; geen parallel Brain/DataHub-pad.
- Brain-writeback alleen als succesvol claimen met execution + target readback.
- Fail-closed voor ongeldige contracts; browser telemetry mag UX nooit blokkeren.
- Batching, dedupe en bounded retries om Make-credits te beschermen.

---

### Task 1: Money Page Contract v2

**Files:**
- Create: `tools/seo-order-engine/money-contract-v2.mjs`
- Modify: `tools/seo-order-engine/validate.mjs`
- Modify: `tools/seo-order-engine/enrich.mjs`
- Test: `tests/seo-order-money-v2.test.mjs`

**Interfaces:**
- Produces: `inspectMoneyPage(html, entry) -> string[]`, `markMoneyEvidence(html, entry) -> html`.

- [ ] Write RED tests for missing problem/proposition/evidence/how-it-works/deliverables/audience/pricing-or-cost-route/risk/primary CTA/microconversion/contextual support links.
- [ ] Add a GREEN validator that detects visible semantic evidence only; do not infer nonexistent claims.
- [ ] Add safe markers for existing sections where headings/classes already prove the section role.
- [ ] Wire `validate.mjs` so every registry `role=money` fails release on missing v2 requirements.
- [ ] Run `node --test tests/seo-order-money-v2.test.mjs tests/seo-order-*.test.mjs`.

### Task 2: Future Blog Contract v2

**Files:**
- Modify: `tools/seo-order-engine/blog-contract.mjs`
- Modify: `tools/seo-order-engine/apply.mjs`
- Test: `tests/seo-order-blog-v2.test.mjs`

**Interfaces:**
- `inspectBlog()` additionally requires v2 contract marker, intent marker and funnel marker.

- [ ] RED fixture: new blog with technically valid HTML but missing commercial route/intent must fail.
- [ ] Upgrade enrichment to `bg-order-contract=v2`, intent/keyword-cluster metadata and absolute internal links.
- [ ] Preserve existing author/date/evidence/money-link/CTA contract.
- [ ] Verify idempotency by running enrichment twice in test.

### Task 3: Browser Measurement Contract

**Files:**
- Create: `tools/seo-order-engine/measurement.mjs`
- Modify: `tools/seo-order-engine/conversion.mjs`
- Create: `netlify/functions/growth-event.mjs`
- Test: `tests/seo-order-measurement.test.mjs`

**Interfaces:**
- `injectGrowthMeasurement(html, meta)` injects one idempotent tracker.
- POST `/api/growth-event` accepts only allowlisted event fields and returns 202/204 without exposing secrets.

- [ ] RED tests for page_view/organic_landing/CTA/money-link/engaged-view payload shape and PII rejection.
- [ ] Implement deterministic `event_id`/`attribution_root` generation from non-PII session-scoped random id + canonical/event/time bucket.
- [ ] Use `navigator.sendBeacon` with `fetch(...,{keepalive:true})` fallback; never block navigation.
- [ ] Add scroll/time engaged event once per page.
- [ ] Function validates allowlisted fields, schema version and origin; rejects email/phone/name/free-text fields.

### Task 4: Growth Observation Normalizer

**Files:**
- Create: `config/seo-growth-observation.schema.json`
- Create: `tools/seo-growth/normalize-observation.mjs`
- Test: `tests/seo-growth-observation.test.mjs`

**Interfaces:**
- `normalizeBehaviorEvent(event) -> GrowthObservation`
- `normalizeSearchMetric(metric) -> GrowthObservation`

- [ ] Define one schema for canonical, intent, source signal, metrics, period/event id, attribution root and evidence refs.
- [ ] RED tests prove onsite/search inputs normalize to the same canonical+intent model and reject PII.
- [ ] Implement dedupe fingerprint `source|canonical|intent|period-or-event|metric-kind`.

### Task 5: BG211 / Powerhouse Producer Contract

**Files:**
- Modify: `config/universal-event-producers.json`
- Create: `config/seo-growth-loop.json`
- Test: `tests/seo-growth-bg211-contract.test.mjs`

**Interfaces:**
- New producer id `seo-growth-observation` uses BG211 and canonical learning path.

- [ ] RED test requires the growth producer, BG211 adapter, BG168/BG166 writeback, BG205 graph path, cost guard and fail-closed policy.
- [ ] Register site behavior/search/outcome inputs as one producer family, not separate brains.
- [ ] Encode paused/capacity handling as dedupeable open learning obligation with no retry storm.

### Task 6: DataHub / Runtime Ingest Adapter

**Files:**
- Modify: `netlify/functions/growth-event.mjs`
- Create: `tools/seo-growth/bg211-envelope.mjs`
- Test: `tests/seo-growth-ingest.test.mjs`

**Interfaces:**
- `toBg211Envelope(observation)` returns the existing universal event envelope fields plus growth payload.

- [ ] RED tests require immutable fingerprint, producer id, event type, evidence and materiality metadata.
- [ ] Implement adapter without direct BG166 write; all durable learning routes through BG211/BG168.
- [ ] If runtime target configuration is absent/unavailable, accept client telemetry into bounded durable/queued path only when existing repo infrastructure supports it; otherwise return a retry-safe response and never claim Brain learning.

### Task 7: Search Intelligence Ingest Contract

**Files:**
- Create: `tools/seo-growth/search-intelligence.mjs`
- Create: `config/seo-search-sources.json`
- Test: `tests/seo-growth-search-intelligence.test.mjs`

**Interfaces:**
- `normalizeSearchRows(rows, source) -> GrowthObservation[]`.

- [ ] Support Search Console-shaped and DataForSEO-shaped normalized input without embedding provider secrets.
- [ ] Map queries to registry keyword clusters and canonical intent.
- [ ] Preserve unknown query clusters as discovery candidates, never auto-create thin pages.
- [ ] Add cost guard: paid provider work only for bounded opportunities after deterministic pre-gate.

### Task 8: Outcome Attribution

**Files:**
- Create: `tools/seo-growth/outcome-attribution.mjs`
- Test: `tests/seo-growth-outcome-attribution.test.mjs`

**Interfaces:**
- `attachOutcome(observationSet, outcome) -> attributed observation` keyed by non-PII attribution root.

- [ ] RED tests for CTA→lead→order chain, missing downstream data and duplicate outcomes.
- [ ] Do not treat unknown outcome as zero; represent confidence/completeness explicitly.
- [ ] Revenue is optional numeric evidence and never inferred.

### Task 9: Growth Scoring and Opportunity Selection

**Files:**
- Create: `tools/seo-growth/score.mjs`
- Create: `tools/seo-growth/opportunities.mjs`
- Test: `tests/seo-growth-score.test.mjs`

**Interfaces:**
- `scoreGrowthWindow(observations) -> {score, confidence, components}`
- `proposeOpportunities(window, registry) -> Opportunity[]`.

- [ ] Weight visibility→CTR→engagement→CTA→lead→order→revenue while retaining confidence.
- [ ] Detect high-impression/low-CTR, high-traffic/low-CTA, strong-CTA/weak-order and cannibalization patterns.
- [ ] Never select on traffic alone.

### Task 10: Bounded Optimization Contract

**Files:**
- Create: `config/seo-optimization-allowlist.json`
- Create: `tools/seo-growth/optimization-contract.mjs`
- Test: `tests/seo-growth-optimization-contract.test.mjs`

**Interfaces:**
- `validateOptimizationCandidate(candidate) -> errors[]`.

- [ ] Allow only title/meta, CTA copy/position, contextual link, gap marker, supporting-blog opportunity, cannibalization proposal, keyword expansion, evidence gap.
- [ ] Block new testimonials, customer outcomes, price changes, guarantees, legal claims and unsupported factual claims.
- [ ] Require before/after hypothesis, metric target, rollback condition and source evidence refs.

### Task 11: Estate-wide Build / Release Gates

**Files:**
- Modify: `tools/prijzen-uit-de-homepage.mjs`
- Modify: `.github/workflows/seo-order-engine.yml`
- Modify: `.github/workflows/canonical-brand-shell-full-build.yml`
- Modify: `.github/workflows/canonical-brand-shell-live-readback.yml`
- Test: `tests/seo-growth-release-contract.test.mjs`

**Interfaces:**
- Netlify-equivalent verify stage runs technical SEO + SEO Order v2 + growth measurement contract.

- [ ] Add contract tests to CI.
- [ ] Full build must fail on a weak money page/new blog or invalid measurement marker.
- [ ] Production readback checks representative pillar, money, support and blog pages plus telemetry endpoint health.

### Task 12: BRAIN Delivery Classification

**Files:**
- Modify: `config/brain-delivery-system.json`
- Test: existing delivery classifier tests plus `tests/seo-growth-bg211-contract.test.mjs`.

- [ ] Add `seo-growth-intelligence` component under website/growth delivery ownership.
- [ ] Ensure changes to measurement, observation, scoring and optimization contracts trigger the correct website/BRAIN lanes.

### Task 13: Integration Verification and Production

- [ ] Run all `tests/seo-order-*.test.mjs` and `tests/seo-growth-*.test.mjs`.
- [ ] Run Netlify-equivalent full build.
- [ ] Open draft PR early, inspect changed files and automated reviews.
- [ ] Require green Required test, SEO Order Engine, full build, BRAIN delivery and Netlify preview.
- [ ] Mark ready, merge only at unchanged verified head SHA.
- [ ] Verify Netlify production deploy `commit_ref` equals merge SHA.
- [ ] Verify live production readback is green.
- [ ] Record any runtime BG211/BG168/BG166 blocker as an open dedupeable learning obligation; do not claim runtime Brain writeback without evidence.
