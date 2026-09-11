# Portal V2 Project Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw in Portal V2 één samenhangende projectwerklaag met één mobiele hoofdnavigatie, contextuele projectgroepen en een projectcockpit zonder verzonnen data.

**Architecture:** De bestaande router, page registry, shell en domain state blijven canoniek. `navigation-model.js` definieert de globale ingang, `hubs.js` definieert één projecttaxonomie, `app.js` rendert die taxonomie, en een geïsoleerde `project-overview.js` projecteert alleen aanwezige state naar de cockpit. Ontbrekende legacy-projectfuncties krijgen native V2-page-id's met eerlijke empty states en links naar bestaande capabilities; er komt geen tweede datastore.

**Tech Stack:** Vanilla ES modules, DOM, CSS, Node test runner, bestaande Portal V2 router/domain state.

**Spec:** `docs/superpowers/specs/2026-09-11-portal-v2-project-navigation-design.md`

## Global Constraints

- Mobiel exact één permanente bottom navigation: Overzicht / Project / Data & AI / Taken / Meer.
- Project target is `hub:project`.
- Projectgroepen exact: Overzicht / Commercieel / Bouwen & koppelen / Projectinformatie / Samenwerken.
- Bestaande `page=` en `hub=` routing blijft canoniek en deep links blijven werken.
- Geen voorbeeldcijfers, geschatte statussen of tweede datastore.
- Touch targets minimaal 44x44px; alleen de projecttabrij mag horizontaal scrollen.
- Geen merge/live-claim zonder groene Required-suite en production readback op dezelfde SHA.

---

### Task 1: Navigatiecontract en projecthub

**Files:**
- Modify: `portal-v2/navigation-model.js`
- Modify: `portal-v2/hubs.js`
- Create: `portal-v2/tests/project-navigation.test.mjs`

**Interfaces:**
- Produces: `PORTAL_NAV_ITEMS` met `project -> hub:project`.
- Produces: `PROJECT_GROUPS`, `HUB_DEFINITIONS.project`, `groupedHubPages('project')`.

- [ ] Schrijf eerst tests die de vijf mobiele items, projecttarget, vijf projectgroepen en unieke projectpagina's afdwingen.
- [ ] Bewijs RED tegen de huidige branch.
- [ ] Wijzig het navigatiemodel en voeg de canonieke projecthub toe.
- [ ] Bewijs GREEN en commit.

### Task 2: Native routes voor ontbrekende projectonderdelen

**Files:**
- Modify: `portal-v2/page-registry.js`
- Modify: `portal-v2/native-pages.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `portal-v2/tests/project-navigation.test.mjs`

**Interfaces:**
- Produces page-id's: `project-overzicht`, `uren-facturen`, `integraties`, `notities`, `activiteit`, `team-toegang`.
- Alle nieuwe pagina's gebruiken bestaande shell/state en tonen zonder brondata een expliciete empty state.

- [ ] Breid tests uit zodat alle afgesproken functies één keer in Project voorkomen en alle targets in de page registry bestaan.
- [ ] Voeg de minimale registry/copy/action-contracten toe; geen businesslogica dupliceren.
- [ ] Bewijs GREEN en commit.

### Task 3: Projectcockpit en contextuele projectnavigatie

**Files:**
- Create: `portal-v2/project-overview.js`
- Modify: `portal-v2/app.js`
- Modify: `portal-v2/navigation.css`
- Modify: `portal-v2/index.html`
- Create: `portal-v2/tests/project-overview.test.mjs`

**Interfaces:**
- Produces: `projectOverviewModel(state)` en `renderProjectOverview(root,state,{openPage})`.
- Consumes alleen bestaande Portal V2 domain state; ontbrekende waarden worden `null`/`Nog geen status`.

- [ ] Schrijf tests voor fail-closed modelvorming: ontbrekende state levert geen cijfers/statusclaims op; aanwezige offerte/taken/documenten/teamwaarden worden wel geprojecteerd.
- [ ] Bouw cockpitkaarten voor fase, offerte, uren/budget, bouwen/koppelen, taken, team, kennis en recente activiteit.
- [ ] Render bij `hub:project` eerst cockpit en daaronder vijf projecttabs/groepen.
- [ ] Vervang mobiel label Portaal door Project en voorkom een parallel projectmenu.
- [ ] Voeg 44px touch targets, tabscroll en actieve context toe.
- [ ] Bewijs GREEN en commit.

### Task 4: Regressie en delivery

**Files:**
- Test: `portal-v2/tests/*.test.mjs`
- Test: relevante `tests/portal-*`, `tests/delivery-*`

- [ ] Open PR vanaf `feature/portal-v2-project-navigation`.
- [ ] Laat Required/Portal V2/preview/readback checks draaien op exact head-SHA.
- [ ] Repareer uitsluitend concrete regressies; verzwak geen gates.
- [ ] Merge pas als de vereiste checks groen zijn.
- [ ] Verifieer na merge dat productie de merge-SHA serveert en mobile + desktop readback groen zijn.
