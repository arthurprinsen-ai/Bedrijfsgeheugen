# SEO Order Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak van de bestaande technische SEO-laag een afdwingbare SEO-to-order machine voor huidige pagina's en alle toekomstige blogs.

**Architecture:** Een centrale intent-registry bepaalt per primaire route rol, zoekintentie, funnel en CTA. Een idempotente enrichment-laag voegt structured data, auteur/evidence/CTA-contracten en conversiemarkers toe; een aparte validator controleert de internal-link graph, blogcontracten en money-page contracten vóór sitemap/deploy.

**Tech Stack:** Node.js 24 ESM, statische HTML, JSON, GitHub Actions, Netlify, bestaande canonical Brand Shell.

**Spec:** `docs/superpowers/specs/2026-09-05-seo-order-engine-design.md`

## Global Constraints

- Alle gegenereerde interne HTML-links zijn volledig absoluut onder `https://www.bedrijfsgeheugen.nl/...`.
- Structured data bevat uitsluitend zichtbare/ware gegevens.
- Geen automatisch aangemaakte dunne SEO-landingspagina's.
- De bestaande canonical Brand Shell blijft onaangetast als globale UI-bron.
- Geen productieclaim zonder full build + Netlify preview + production readback.

---

### Task 1: Intent Registry en contract API

**Files:**
- Create: `site/seo-order-map.json`
- Create: `tools/seo-order-engine/registry.mjs`
- Test: `tests/seo-order-registry.test.mjs`

**Interfaces:**
- Produces: `loadRegistry()`, `validateRegistry(registry)`, `entryForCanonical(url)`, `moneyEntries(registry)`.

- [ ] **Step 1: Write failing tests** voor duplicate `primary_intent`, duplicate `primary_keyword`, niet-absolute route/CTA en geldige startregistry.
- [ ] **Step 2: Run** `node --test tests/seo-order-registry.test.mjs` en verifieer RED.
- [ ] **Step 3: Implement** registry parser/validator en startclusters uit de spec.
- [ ] **Step 4: Run** dezelfde test tot GREEN.
- [ ] **Step 5: Commit** `feat(seo): add intent registry contract`.

### Task 2: Structured data renderer

**Files:**
- Create: `tools/seo-order-engine/schema.mjs`
- Test: `tests/seo-order-schema.test.mjs`

**Interfaces:**
- Consumes: registry entry + canonical/title/description/breadcrumbs.
- Produces: `renderSeoGraph(meta)` en `injectSeoGraph(html, meta)`.

- [ ] **Step 1: Write failing tests** voor Organization/WebSite/BreadcrumbList plus `Article` en `Service`, vaste `@id`s en idempotentie.
- [ ] **Step 2: Run** `node --test tests/seo-order-schema.test.mjs` en verifieer RED.
- [ ] **Step 3: Implement** JSON-LD renderer zonder ratings/reviews/FAQ-verzinsels.
- [ ] **Step 4: Run** test tot GREEN.
- [ ] **Step 5: Commit** `feat(seo): centralize structured data graph`.

### Task 3: Future Blog Contract en enrichment

**Files:**
- Create: `tools/seo-order-engine/blog-contract.mjs`
- Create: `tools/seo-order-engine/enrich.mjs`
- Test: `tests/seo-order-blog-contract.test.mjs`

**Interfaces:**
- Produces: `inspectBlog(html, path, registry)`, `enrichBlog(html, path, registry)`.

- [ ] **Step 1: Write failing fixture test** met een nieuw blog zonder author/evidence/CTA/schema; verwacht contractfouten.
- [ ] **Step 2: Run** fixturetest en verifieer RED.
- [ ] **Step 3: Implement** zichtbare auteur/reviewer, bron/evidence-detectie, primary CTA/related links en Article/Person/Breadcrumb schema-injectie; geen bestaande tekst herschrijven.
- [ ] **Step 4: Run** test tot GREEN en voeg idempotentietest toe.
- [ ] **Step 5: Commit** `feat(seo): enforce future blog order contract`.

### Task 4: Money Page Contract en internal-link graph

**Files:**
- Create: `tools/seo-order-engine/link-graph.mjs`
- Create: `tools/seo-order-engine/money-contract.mjs`
- Test: `tests/seo-order-link-graph.test.mjs`

**Interfaces:**
- Produces: `buildLinkGraph(pages)`, `validateMoneyPages(pages, registry)`.

- [ ] **Step 1: Write failing tests** voor orphaned money page, supportpagina zonder dominante money-link en alias-link naar niet-canonical route.
- [ ] **Step 2: Run** test en verifieer RED.
- [ ] **Step 3: Implement** graaf en validator; functionele routes blijven buiten SEO-graaf.
- [ ] **Step 4: Run** test tot GREEN.
- [ ] **Step 5: Commit** `feat(seo): enforce commercial internal link graph`.

### Task 5: Conversion attribution

**Files:**
- Create: `tools/seo-order-engine/conversion.mjs`
- Test: `tests/seo-order-conversion.test.mjs`

**Interfaces:**
- Produces: `markPrimaryConversions(html, entry)` en `injectConversionTracker(html)`.

- [ ] **Step 1: Write failing tests** dat geregistreerde primary CTA een `data-bg-conversion` krijgt en tracker idempotent is.
- [ ] **Step 2: Run** test en verifieer RED.
- [ ] **Step 3: Implement** consent-neutrale `dataLayer.push` voor click-intent zonder persoonsgegevens.
- [ ] **Step 4: Run** test tot GREEN.
- [ ] **Step 5: Commit** `feat(growth): attribute organic CTA intent`.

### Task 6: Estate enrichment en high-level gate

**Files:**
- Create: `tools/seo-order-engine/apply.mjs`
- Create: `tools/seo-order-engine/validate.mjs`
- Modify: `tools/prijzen-uit-de-homepage.mjs`
- Modify: `tools/controleer-technische-seo.mjs`
- Test: `tests/seo-order-estate.test.mjs`

**Interfaces:**
- Produces CLI `node tools/seo-order-engine/apply.mjs` en `node tools/seo-order-engine/validate.mjs`.

- [ ] **Step 1: Write failing estate test** die build-output inspecteert op schema/blog/money/link/conversion contracten.
- [ ] **Step 2: Run** estate test en verifieer RED.
- [ ] **Step 3: Implement** finale volgorde: canonical shell -> page policy -> SEO enrichment -> sitemap -> low-level technical SEO -> high-level SEO-order gate.
- [ ] **Step 4: Run** estate test en bestaande SEO/shell tests tot GREEN.
- [ ] **Step 5: Commit** `feat(seo): add estate-wide SEO order gate`.

### Task 7: CI/Netlify borging

**Files:**
- Create: `.github/workflows/seo-order-engine.yml`
- Modify: `.github/workflows/canonical-brand-shell-full-build.yml`
- Modify: `netlify.toml` indien de buildcommand de nieuwe apply/validate stappen nog niet via `prijzen-uit-de-homepage.mjs` erft.

**Interfaces:**
- Produces required evidence dat unit contracts én Netlify-equivalente full build dezelfde gate uitvoeren.

- [ ] **Step 1: Voeg workflow toe** voor registry/schema/blog/link/conversion tests.
- [ ] **Step 2: Voeg full-build stap toe** voor high-level `validate.mjs`.
- [ ] **Step 3: Push en open draft PR** tegen `main`.
- [ ] **Step 4: Inspecteer alle CI en Netlify preview**; self-heal concrete failures zonder gates te versoepelen.
- [ ] **Step 5: Commit** `ci(seo): make order engine a release contract`.

### Task 8: Production verification

**Files:**
- Geen nieuwe productielogica; alleen merge/readback nadat alle checks groen zijn.

- [ ] **Step 1: Verify** volledige PR checkset en Netlify preview `ready` op exacte head SHA.
- [ ] **Step 2: Merge** alleen met expected head SHA.
- [ ] **Step 3: Verify** Netlify production deploy draait exacte merge SHA.
- [ ] **Step 4: Readback** van `/`, `/prijzen`, `/product`, `/afas-koppeling`, `/bedrijfsgeheugen` en één blog op canonical/schema/CTA/internal links.
- [ ] **Step 5: Alleen daarna** productie als gereed rapporteren.