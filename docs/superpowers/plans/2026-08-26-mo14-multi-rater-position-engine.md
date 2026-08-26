# MO14-1 Multi-Rater Position Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak van de bestaande MO14-1 Coach Playbook een multi-rater coachhub waarin vijf begeleiders onafhankelijk beoordelen, een gezamenlijk teambeeld ontstaat en de beste 4-3-3/3-4-3/4-4-2 centraal wordt berekend en opgeslagen.

**Architecture:** De bestaande mobiele HTML-app blijft de UI. Make vormt de API-laag tussen browser en Notion. Notion wordt de centrale bron voor beoordelaars, spelers, beoordelingen en opstellingen. De browser bevat de uitlegbare positie-engine en teamoptimizer, maar rekent primair met centraal opgehaalde teamdata.

**Tech Stack:** HTML/CSS/vanilla JavaScript, Netlify, Make webhooks/scenario's, Notion database/data sources, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-26-mo14-multi-rater-position-engine-design.md`

## Global Constraints

- Behoud bestaande homepage, motto, ambitie, teamcultuur, coachwoorden, wedstrijdcultuur, balbezit/balverlies, succesmeting en tactiek.
- Behoud alle 14 speelsters.
- Iedere beoordeling is uniek per beoordelaar + speelster + beoordelingsmoment.
- Geen persoonlijke internetdata over minderjarige speelsters gebruiken.
- UI blijft bruikbaar op iPhone/Safari.
- Geen beoordelaar mag scores van een andere beoordelaar overschrijven.
- 4-3-3, 3-4-3 en 4-4-2 blijven beschikbaar.

---

### Task 1: Centraliseer beoordelaars en beoordelingsdata in Notion

**Files:**
- Modify: Notion data source `PW MO14-1 Spelersdata 2025-2026`
- Create/extend: beoordelaars- en beoordelingenstructuur in dezelfde Hub

**Interfaces:**
- Consumes: bestaande spelerrecords en opstellingsrecords.
- Produces: reviewer IDs, assessment records en querybare teamdata voor Make/UI.

- [ ] **Step 1: Inspecteer het bestaande Notion schema**

Fetch de data source en bevestig exacte property-namen en types.

- [ ] **Step 2: Voeg reviewer- en assessment-velden/datasets toe**

Leg minimaal vast: `reviewer_id`, `reviewer_name`, `player_id`, `assessment_id`, `moment`, 14 scorevelden, `observatie`, `status`, `bron`.

- [ ] **Step 3: Maak vijf actieve beoordelaarsrecords**

Gebruik de door de gebruiker aangewezen vijf begeleiders; sla geen telefoonnummers op.

- [ ] **Step 4: Verifieer met een query**

Query spelers, beoordelaars en lege/beoordelingsrecords en controleer unieke IDs.

- [ ] **Step 5: Commit documentatie indien schema-informatie in repo wordt vastgelegd**

```bash
git add docs/superpowers/specs/2026-08-26-mo14-multi-rater-position-engine-design.md
git commit -m "docs: define MO14 multi-rater data model"
```

### Task 2: Bouw Make write/read API voor beoordelingen

**Files:**
- Modify: Make scenario `PW MO14-1 Coach Playbook → Notion`
- Create: Make scenario `PW MO14-1 Teambeeld API` indien huidige scenario niet veilig beide richtingen kan afhandelen

**Interfaces:**
- Consumes: POST payload `{assessmentId, playerId, reviewerId, scores, observation, timestamp}`.
- Produces: idempotente write naar Notion en read response met assessments/teambeelddata.

- [ ] **Step 1: Inspecteer huidige scenario modules en mappings**

Bevestig webhook, Notion connection en page update module.

- [ ] **Step 2: Schrijf een testpayload voor een niet-productieve testbeoordeling**

```json
{
  "assessmentId": "test-reviewer__test-player__2026-08-26",
  "playerId": "test-player",
  "reviewerId": "test-reviewer",
  "scores": {
    "techniek": 3,
    "spelinzicht": 3,
    "verdedigen": 3,
    "snelheid": 3,
    "loopvermogen": 3,
    "rust": 3,
    "aanvallend": 3,
    "communicatie": 3,
    "balbezit": 3,
    "nietBalbezit": 3,
    "omschakeling": 3,
    "moed": 3,
    "winnendeKracht": 3,
    "teamgedrag": 3
  },
  "observation": "TEST",
  "timestamp": "2026-08-26T15:00:00Z"
}
```

- [ ] **Step 3: Maak write idempotent**

Gebruik `assessmentId` als unieke sleutel; zelfde ID update dezelfde beoordeling, andere reviewer maakt een ander record.

- [ ] **Step 4: Bouw read-route voor alle actieve assessments**

Response bevat per assessment reviewer, player, timestamp en alle scorevelden.

- [ ] **Step 5: Test write → read roundtrip**

Verwacht: precies één testrecord, dezelfde waarden, geen wijziging aan bestaande spelerrecords.

### Task 3: Splits de live HTML-logica in duidelijke modules binnen de bestaande single-file app

**Files:**
- Modify: `pw-mo14-1/index.html`

**Interfaces:**
- Consumes: bestaande `P`, formatieprofielen, localStorage en webhookconfig.
- Produces: `reviewerStore`, `assessmentStore`, `teamView`, `positionEngine`, `lineupEngine` functies.

- [ ] **Step 1: Leg regressiechecks vast vóór wijziging**

Controleer dat huidige pagina teksten bevat: `SAMEN STERK`, `Tactiek & coachwoorden`, `Speelsters & posities`, `Automatische opstellingen`, `Succes meten`.

- [ ] **Step 2: Voeg reviewerselectie toe**

Functies:
```js
function setActiveReviewer(reviewerId) {}
function getActiveReviewer() {}
function renderReviewerSelector() {}
```

- [ ] **Step 3: Voeg assessment model toe**

```js
function assessmentKey(reviewerId, playerId) {
  return `${reviewerId}__${playerId}`;
}
function getMyAssessment(playerId) {}
function saveDraftAssessment(playerId, scores, observation) {}
```

- [ ] **Step 4: Behoud bestaande lokale invoer als draft fallback**

Lokale data mag nooit verdwijnen bij netwerkfout.

- [ ] **Step 5: Run syntaxcheck**

Extract inline JavaScript en run `node --check` op een tijdelijk `.js`-bestand.

### Task 4: Bouw Teambeeld-algoritme

**Files:**
- Modify: `pw-mo14-1/index.html`

**Interfaces:**
- Consumes: array van assessments per player.
- Produces: `aggregatePlayerAssessments(assessments)` met averages, min, max, reviewerCount, conflicts en confidence.

- [ ] **Step 1: Schrijf testgevallen**

```js
// 3 reviewers: scores 2,4,5 -> average 3.67, conflict true
// 2 reviewers: scores 4,4 -> average 4, conflict false
// 1 reviewer -> confidence low
```

- [ ] **Step 2: Implementeer aggregatie**

```js
function aggregateMetric(values) {
  const avg = values.reduce((a,b)=>a+b,0)/values.length;
  return {avg, min:Math.min(...values), max:Math.max(...values), conflict:Math.max(...values)-Math.min(...values)>=2};
}
```

- [ ] **Step 3: Implementeer confidence**

1 reviewer = `laag`, 2 = `middel`, 3+ = `hoog`; meerdere kernconflicten verlagen één niveau.

- [ ] **Step 4: Toon Teambeeld op elke speelsterpagina**

Toon reviewerCount, gemiddelde per kenmerk, conflictbadge, beste/2e/ontwikkelpositie en confidence.

- [ ] **Step 5: Verifieer dat Mijn beoordeling en Teambeeld van elkaar gescheiden blijven**

### Task 5: Breid de positie-engine uit naar volledige hockeyprofielen

**Files:**
- Modify: `pw-mo14-1/index.html`

**Interfaces:**
- Consumes: aggregated metrics.
- Produces: `calculatePositionFits(teamView)` → gesorteerde fits voor `GK`, `FB`, `CB`, `WM`, `CM`, `W`, `ST`.

- [ ] **Step 1: Definieer 14 meetvelden en gewichten per positie**

Alle gewichten per profiel sommeren exact tot 1.0.

- [ ] **Step 2: Test dat een defensief profiel CB/FB prefereert**

Gebruik synthetische scores met verdedigen/rust/spelinzicht hoog en aanvallend laag.

- [ ] **Step 3: Test dat een aanvallend snel profiel W/ST prefereert**

Gebruik snelheid/techniek/aanvallend/moed hoog.

- [ ] **Step 4: Implementeer fitformule**

```js
fit = Math.round(weightedScore / 5 * 100);
```

- [ ] **Step 5: Toon uitleg waarom een positie past**

Noem de drie sterkste bijdragekenmerken en de twee grootste ontwikkelgaten.

### Task 6: Herbouw teamoptimizer op gezamenlijke teamdata

**Files:**
- Modify: `pw-mo14-1/index.html`

**Interfaces:**
- Consumes: alle complete `teamView` profielen.
- Produces: beste unieke assignment voor 4-3-3, 3-4-3 en 4-4-2 plus teamfit en wissels.

- [ ] **Step 1: Test unieke assignment**

Geen playerId mag twee keer in dezelfde basisopstelling voorkomen.

- [ ] **Step 2: Test minimum 11 speelsters**

Bij minder dan 11 beschikbare teamprofielen verschijnt geen nep-opstelling.

- [ ] **Step 3: Voeg zachte balansbonus toe**

Centrum beloont spelinzicht/rust; buitenposities snelheid; achterste lijn verdedigen/niet-balbezit; voorste lijn aanvallend instinct/moed.

- [ ] **Step 4: Render alle drie formaties op het bestaande veld**

Iedere tegel toont naam, positie, individuele fit en teamfit.

- [ ] **Step 5: Schrijf resultaat naar bestaande opstellingenroute in Notion**

Payload bevat formatie, lineup JSON, teamfit, confidence en aantal gebruikte beoordelingen.

### Task 7: Maak multi-device sync robuust

**Files:**
- Modify: `pw-mo14-1/index.html`
- Modify: relevante Make read/write scenario's

**Interfaces:**
- Consumes: centrale assessments uit Notion.
- Produces: consistente UI op verschillende telefoons.

- [ ] **Step 1: Voeg `Ververs teambeeld` en last-sync timestamp toe**

- [ ] **Step 2: Bij openen laad centrale data**

Als laden faalt: toon lokale draft + foutmelding, niet leeg scherm.

- [ ] **Step 3: Na save herlaad alleen de betreffende speelster**

- [ ] **Step 4: Test met twee reviewer-identiteiten in twee browsersessies**

Verwacht: reviewer A ziet eigen invoer; reviewer B overschrijft A niet; Teambeeld bevat beide.

### Task 8: Deploy en regressietest productie

**Files:**
- Modify: `pw-mo14-1/index.html`
- Existing workflow: `.github/workflows/pw-mo14-netlify-deploy.yml`

**Interfaces:**
- Consumes: afgeronde app en Make/Notion routes.
- Produces: live `https://pw-mo14-1.netlify.app`.

- [ ] **Step 1: Commit appwijzigingen**

```bash
git add pw-mo14-1/index.html
git commit -m "feat: add multi-rater MO14 position engine"
```

- [ ] **Step 2: Controleer GitHub Actions deploy**

Verwacht: workflow `Deploy PW MO14-1 to Netlify` conclusion `success`.

- [ ] **Step 3: Controleer Netlify production deploy**

Verwacht: project `pw-mo14-1`, deploy state `ready`.

- [ ] **Step 4: Productieregressie**

Controleer homepage, hoofdmenu, tactiek, alle 14 speelsters, reviewerkeuze, mijn beoordeling, teambeeld, 4-3-3, 3-4-3, 4-4-2 en succesmeting.

- [ ] **Step 5: Echte veilige write-test**

Gebruik één expliciete testbeoordeling of door gebruiker ingevoerde score; verifieer Make execution `success` en Notion record. Verwijder testdata indien synthetisch.
