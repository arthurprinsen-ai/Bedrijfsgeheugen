# Sitewide Landing Page Contract v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak alle huidige en toekomstige indexeerbare pagina's expliciet geclassificeerd en borg high-intent landingspagina's met één intent-owner en het volledige money-page v3 conversiecontract.

**Architecture:** Breid de bestaande SEO Order Engine uit in plaats van een parallel systeem te bouwen. De registry wordt de fail-closed bron voor niet-blogpagina's; blogartikelen blijven automatisch supporting. Money-page v3 wordt een deterministische enrichment/validation-laag bovenop v2, met FAQ, direct antwoord, methodologie en update-signalen zonder gefabriceerd bewijs.

**Tech Stack:** Node.js 24, static HTML, GitHub Actions, Netlify, bestaande SEO Order Engine/Growth Measurement.

**Spec:** `docs/superpowers/specs/2026-09-06-sitewide-landingpage-v3-design.md`

## Global Constraints
- Alle interne hrefs die worden toegevoegd zijn absolute `https://www.bedrijfsgeheugen.nl/...` URLs.
- Geen verzonnen cases, resultaten, klantclaims, omzet, accreditaties of bewijs.
- Nieuwe onbekende indexeerbare niet-blogpagina's moeten fail-closed de build blokkeren.
- Blogs blijven automatisch `article/supporting` en mogen niet een tweede commerciële owner worden.
- Alleen geregistreerde `money` routes krijgen commerciële v3-injectie.
- Production green vereist exact-SHA Netlify readback.

---

### Task 1: Fail-closed coverage contract

**Files:**
- Create: `tests/seo-sitewide-classification.test.mjs`
- Modify: `tools/seo-order-engine/apply.mjs`

**Interfaces:**
- Consumes: `entryForCanonical(canonical, registry)`
- Produces: fout bij onbekende indexeerbare niet-blogcanonical

- [ ] **Step 1: Write the failing test**

Maak een test die een tijdelijke publieke HTML-pagina met canonical `https://www.bedrijfsgeheugen.nl/onbekende-commerciele-pagina` toevoegt en verwacht dat `applySeoOrderEngine()` reject met `niet geregistreerd`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/seo-sitewide-classification.test.mjs`
Expected: FAIL omdat onbekende pagina nu nog als generic/support wordt verrijkt.

- [ ] **Step 3: Write minimal implementation**

In `apply.mjs`: voor niet-blog, indexeerbare Bedrijfsgeheugen-canonicals zonder registry-entry: `throw new Error('Indexeerbare pagina niet geregistreerd: ...')` in plaats van `enrichGenericPage`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/seo-sitewide-classification.test.mjs`
Expected: PASS.

### Task 2: Registry coverage huidige site

**Files:**
- Modify: `site/seo-order-map.json`
- Test: `tests/seo-sitewide-classification.test.mjs`

**Interfaces:**
- Produces: expliciete entry voor iedere huidige indexeerbare niet-blogcanonical.

- [ ] **Step 1: Add failing coverage assertion**

Parse `sitemap.xml`, filter blogroutes, en assert dat alle overige canonicals een registry-entry hebben behalve expliciete non-content aliases/noindex exclusions.

- [ ] **Step 2: Run and capture missing routes**

Run: `node --test tests/seo-sitewide-classification.test.mjs`
Expected: FAIL met lijst huidige ongeregistreerde routes.

- [ ] **Step 3: Register all missing current routes**

Voeg expliciete entries toe met unieke primary intent/keyword, passende funnel, CTA en schema. Classificeer high-intent routes als money; utility/trust als support. Gebruik alleen absolute URLs.

- [ ] **Step 4: Re-run coverage test**

Run: `node --test tests/seo-sitewide-classification.test.mjs`
Expected: PASS en geen keyword collisions.

### Task 3: Money Page v3 contract

**Files:**
- Create: `tools/seo-order-engine/money-contract-v3.mjs`
- Modify: `tools/seo-order-engine/enrich.mjs`
- Create: `tests/seo-money-contract-v3.test.mjs`

**Interfaces:**
- Produces: `enrichMoneyPageV3(html, entry)` en `inspectMoneyPageV3(html, entry)`.

- [ ] **Step 1: Write failing tests**

Assert voor money page: `data-bg-money-contract="v3"`, `direct-answer`, `methodology`, `faq`, reviewer Arthur Prinsen, `dateModified`, absolute CTA en idempotency. Assert support page krijgt dit blok niet.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/seo-money-contract-v3.test.mjs`
Expected: FAIL omdat v3 nog niet bestaat.

- [ ] **Step 3: Implement deterministic v3 enrichment**

Voeg een compact v3-blok toe met direct antwoord gebaseerd op `entry.primary_intent`, methodologie/reviewer, drie buyer-vragen afgeleid van kosten/aanpak/fit, update-signaal en bestaande CTA/supportlinks. Injecteer geen klantresultaten.

- [ ] **Step 4: Integrate after v2**

In `enrich.mjs`: `enrichMoneyPage()` gevolgd door `enrichMoneyPageV3()`; daarna conversion/schema.

- [ ] **Step 5: Run tests**

Run: `node --test tests/seo-money-contract-v3.test.mjs tests/seo-order-*.test.mjs`
Expected: PASS.

### Task 4: Estate-wide validation gate

**Files:**
- Modify: `tools/seo-order-engine/gate.mjs` or existing SEO order validation entrypoint discovered in repo
- Test: `tests/seo-sitewide-classification.test.mjs`, `tests/seo-money-contract-v3.test.mjs`

- [ ] **Step 1: Add validation for all registry money pages**

Gate moet na build voor iedere money route v3 markers, intent-owner, reviewer, CTA, evidence, FAQ en absolute links controleren.

- [ ] **Step 2: Verify full suite**

Run: `node --test tests/seo-order-*.test.mjs tests/seo-growth-*.test.mjs`
Expected: 0 failures.

### Task 5: Full build + governed production release

**Files:**
- No new product files unless failures reveal regression.

- [ ] **Step 1: Run GitHub Actions on branch**

Required: SEO order engine, SEO growth intelligence, Required test, Canonical shell contract, Canonical shell full build, Brain delivery classification.

- [ ] **Step 2: Fix root cause of any failed job**

No bypass, no skipping required check.

- [ ] **Step 3: Mark PR ready and merge**

Only after all relevant branch checks are green.

- [ ] **Step 4: Verify exact-SHA production**

Wait until Netlify production `commit_ref` equals merge SHA and `state=ready`.

- [ ] **Step 5: Verify live readback**

Canonical brand shell live readback must complete success on exact merge SHA.
