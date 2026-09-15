# Powerhouse Commercial Closed Loop — design

**Datum:** 2026-09-15  
**Status:** design ter review  
**Bestaande architectuur:** `growth-revenue-os-architecture-v1`  
**North star:** EUR 1.000.000 aantoonbaar toegeschreven omzet uiterlijk 2027-09-12.

## 1. Doel

De Bedrijfsgeheugen Powerhouse uitbreiden van een systeem dat al signalen, opportunities, contentbeslissingen, forecasts en learnings kan vastleggen naar een systeem dat de volledige commerciële lus aantoonbaar sluit:

`evidence → buying signal → latent problem → next best action → veilige uitvoering → provider readback → response/deal/revenue outcome → attribution → calibration → volgende betere beslissing`.

Geen parallel CRM, brain, queue, analytics store of learning store. Bestaande canonieke tabellen, schedulers, delivery lanes, channel-identity gates, BG166/BG167/BG168/BG169 en Supabase blijven leidend.

## 2. Gekozen aanpak

### Aanpak A — aanbevolen: bestaande Growth & Revenue OS verdiepen

Breid de bestaande `powerhouse_*`, growth-, social- en revenue-tabellen en functies uit met scorevelden, decision lineage, action materialization, attribution en calibration. Laat de bestaande hourly/daily guards en bestaande executors de nieuwe obligations verwerken.

**Voordelen:** minste duplicatie, sluit aan op EXISTING-STATE-FIRST/REUSE-FIRST, bestaande security/delivery/learning gates blijven bruikbaar, één operationele waarheid.

### Aanpak B — aparte commerciële agent/service

Nieuwe service die zelf signals, acties en outcomes beheert en synchroniseert naar Powerhouse.

**Afgewezen:** creëert tweede waarheid, extra queue/state, dubbele recovery en grotere kans op identity/security drift.

### Aanpak C — alleen heuristieken in bestaande content-orchestrator

Buying intent en next-best-action rechtstreeks in de contentbeslislaag verwerken.

**Afgewezen:** vermengt content met sales orchestration, maakt causale learning zwakker en schaalt slecht naar e-mail, cockpit, lead/opportunity en revenue outcomes.

## 3. Architectuur

### 3.1 Signal fusion en buying-window detection

Gebruik bestaande evidencebronnen en lineage. Introduceer geen nieuwe externe waarheid; waar nodig worden bestaande Powerhouse-opportunity records uitgebreid met afgeleide commerciële signalen:

- buying-window score;
- latent-problem score;
- evidence confidence;
- freshness;
- contradiction penalty;
- expected commercial value;
- recommended horizon.

Signal classes omvatten minimaal: website/search gedrag, social engagement, relationship graph, hiring, management/organisatieverandering, M&A/investering, tech/process signalen, content/search intent, contacthistorie en bestaande sales/outcomes.

Iedere afleiding bewaart bron, tijdstip, confidence, falsifier en expiry.

### 3.2 Problem-before-the-buyer-knows-it

Voeg een afleidingslaag toe boven bestaande opportunities/graph:

`observed signals → hypothesized operational friction → estimated impact → evidence → confidence → Bedrijfsgeheugen proposition fit`.

Een latent probleem wordt nooit als feit behandeld. Het blijft expliciet een hypothesis totdat outcome evidence het ondersteunt.

### 3.3 Next Best Action Brain

Één decision function rangschikt per account/contact/opportunity de volgende toegestane actie uit de bestaande execution capabilities:

- no_action;
- public_engagement;
- cockpit_review;
- linkedin_followup;
- email_followup;
- content_nurture;
- blog/SEO asset;
- offer/scan follow-up;
- sales action.

Score minimaal op:

`expected_revenue × probability_of_progress × timing_fit × evidence_confidence × relationship_fit - contact_pressure - execution_risk - identity_risk`.

Hard gates gaan vóór score: consent/eligibility, exact destination, contact pressure, dedupe, identity, truth, provider capability en bestaande kanaalregels.

### 3.4 Action materialization

Los het huidige gat op waarbij opportunities/recommendations wel bestaan maar `actions_materialized = 0` kan blijven.

Een geselecteerde next-best-action wordt idempotent gematerialiseerd in de bestaande `powerhouse_sales_actions`/action queue of bestaande content delivery chain. Geen nieuwe queue.

Elke materialized action krijgt:

- source opportunity/prediction;
- idempotency key;
- owner/executor;
- due time;
- expected outcome;
- expected revenue contribution;
- evidence requirements;
- recovery policy.

Een aanbeveling telt nooit als uitvoering.

### 3.5 Provider execution en readback

Bestaande executors blijven authority:

- Buffer/social via bestaande pre-publish/channel-identity gates;
- blog via approved-central blog lane + BG169;
- Gmail alleen met exact stored recipient en sent-message readback;
- LinkedIn alleen via ondersteunde cockpit/provider route;
- geen Make.

Acties zonder toegestane executor worden `hold`/`blocked`, nooit fake-completed.

### 3.6 Outcome capture

Normaliseer echte commerciële outcomes in de bestaande outcome lineage:

- delivered;
- response;
- positive response;
- meeting;
- qualified lead;
- offer;
- won order;
- lost order;
- realized revenue;
- no response;
- bounce/block/failure.

Alleen geobserveerde outcomes mogen revenue en conversion metrics verhogen.

### 3.7 Revenue attribution graph

Bouw attribution boven bestaande events/relationships/outcomes, niet als aparte store.

Elke gerealiseerde commerciële outcome krijgt touchpoint edges naar voorafgaande relevante evidence/actions. Attributie start conservatief:

- deterministic direct contribution waar bewijs hard is;
- probabilistische contribution weights waar meerdere touchpoints bestaan;
- unattributed blijft toegestaan;
- som van attributed revenue mag nooit groter zijn dan observed realized revenue.

Geen last-click-only waarheid en geen verzonnen causaliteit.

### 3.8 Forecast calibration

Bestaande `powerhouse_forecasts`, `powerhouse_forecast_calibration`, social/revenue learning obligations en outcome evaluaties worden de feedbacklus.

Minimaal berekenen:

- Brier score waar binary probability forecasts bestaan;
- calibration error per decision/signal class;
- false positives;
- false negatives;
- sample size;
- confidence shrinkage bij lage N;
- feature/signal performance per context;
- prediction drift over tijd.

Een model/heuristic mag pas meer beslisgewicht krijgen na voldoende geobserveerde outcomes.

### 3.9 Causal en counterfactual learning

Voor acties/experimenten wordt vóór uitvoering minimaal vastgelegd:

- hypothesis;
- baseline;
- chosen action;
- plausible alternative;
- expected lift;
- observation window.

Na outcome wordt onderscheid gemaakt tussen:

- observed association;
- experimentally supported lift;
- unresolved causality.

Counterfactuals blijven hypotheses tenzij een experiment of voldoende vergelijkbare evidence ze ondersteunt.

### 3.10 Relationship graph enrichment

Gebruik bestaande graph/connection records om temporal edges toe te voegen tussen:

`company/person/signal/problem/content/interaction/action/opportunity/outcome/revenue`.

Iedere edge draagt type, confidence, observed_at, freshness/expiry en source lineage. Stale edges verliezen gewicht.

### 3.11 Company intelligence refresh

Bestaande company intelligence wordt periodiek verrijkt en ververst. Een record is alleen decision-eligible als freshness en confidence boven de canonieke drempel liggen. Missing/stale enrichment creëert een recovery/freshness obligation, geen stilzwijgende fallback naar oude data.

### 3.12 Daily data completeness en freshness

Één canonical freshness/readback contract bewaakt minimaal:

- website analytics;
- Search Console/search/SEO;
- LinkedIn personal/company evidence voor zover provider/API beschikbaar;
- Instagram/Buffer;
- blog/site delivery;
- Gmail/outbound;
- sales outcomes;
- realized revenue.

Per bron: last_success_at, latest_event_at, expected cadence, lag, status, evidence ref en recovery obligation. Een connector die bestaat maar geen recente records levert is niet groen.

### 3.13 Publish/outbound fail-closed

`channel-identity-hard-gate-v2` blijft verplicht voor iedere ondersteunde route. Geen handmatige/directe/provider bypass die een kanaalidentiteit of truth gate overslaat.

De guard valideert minimaal exact destination, actor/account, content persona, business/personal identity, dedupe, contact pressure, media validity, measurement lineage en provider capability.

### 3.14 Security hygiene

Resterende advisor findings worden contractgedreven afgehandeld:

- `rls_enabled_no_policy`: alleen wijzigen als table contract browser/API access vereist;
- SECURITY DEFINER endpoints zoals `bg_klik_vastleggen`: explicit public-intent contract + least privilege + regression test, anders browser execute revoke;
- leaked password protection: alleen via toegestane platform/security change route; geen secret/permissie/security-control wijzigingen buiten hard boundary.

## 4. Dagelijkse gesloten lus

1. Brain/chat-learning preflight.
2. Ingest/freshness check.
3. Signal fusion + graph refresh.
4. Buying-window + latent-problem scoring.
5. Opportunity ranking.
6. Prediction vastleggen vóór actie.
7. Next Best Action berekenen.
8. Hard gates uitvoeren.
9. Idempotent action materialization.
10. Executor delivery.
11. Provider/live readback.
12. Outcome obligations reconciliëren.
13. Revenue attribution bij geobserveerde outcomes.
14. Forecast calibration.
15. Causal/counterfactual learning update.
16. Promote/hold/demote/retire learnings.
17. Scorecard + revenue pace.
18. Material outcome writeback naar Brain/shared context.

## 5. Failure handling

- Geen silent failure.
- Elke missed action/readback/outcome/freshness deadline wordt obligation.
- Maximaal twee identieke retries zonder nieuwe evidence.
- Daarna nieuwe hypothese of veilige fallback.
- Geen gate bypass.
- Geen fake `completed` als provider/outcome evidence ontbreekt.
- Productie blijft last-known-good waar relevant.
- Root cause + regressietest + prevention writeback verplicht voor materiële failures.

## 6. Testing

TDD per capability. Minimaal regressiecontracten voor:

- buying-window scoring gebruikt alleen geldige/fresh evidence;
- latent problems blijven hypotheses;
- NBA respecteert hard gates en contact pressure;
- action materialization is idempotent;
- recommendations tellen niet als execution;
- provider readback vereist voor completion;
- realized revenue is immutable source of truth voor revenue totals;
- attribution sum overschrijdt observed revenue nooit;
- forecast calibration gebruikt alleen post-prediction outcomes;
- stale/missing source maakt freshness contract degraded;
- verkeerde LinkedIn/Instagram identity failt vóór delivery;
- SECURITY DEFINER/public-view regressions blijven fail-closed.

## 7. Release/deployment

Elke lane volgt BRAIN-DELIVERY-v2. Exact geteste kandidaatidentiteit wordt via bestaande GitHub/Supabase/Netlify/BG169 routes gepromoveerd. Databasewijzigingen zijn additief en backward-compatible tenzij een expliciet bewezen migratiecontract anders vereist.

Productie-readback moet minimaal aantonen:

- nieuwe schema/functions/views aanwezig;
- scheduler/guard actief;
- minstens één echte nieuwe run levert signal scoring + prediction + NBA decision;
- materialization werkt of expliciet door hard gate wordt geblokkeerd;
- provider/outcome status wordt correct gereconcilieerd;
- scorecard/calibration leest production data;
- learning/writeback zichtbaar in canonical Brain/shared context.

## 8. Acceptatiecriteria

Het programma is pas **LIVE & BEWEZEN** wanneer:

1. daily/hourly productiecycle draait;
2. signals → opportunity → prediction → NBA → action materialization aantoonbaar werkt;
3. een recommendation niet meer als uitvoering kan worden geteld;
4. supported actions provider-readback hebben;
5. outcome/revenue evidence terugstroomt;
6. attribution alleen observed revenue verdeelt;
7. calibration echte prediction/outcome-paren verwerkt;
8. freshness contract alle verplichte bronnen bewaakt;
9. identity/outbound gates fail-closed zijn op alle ondersteunde routes;
10. regression/security/release gates groen zijn;
11. root causes, fixes, outcomes en preventieregels via bestaande learning/writeback zichtbaar zijn;
12. geen parallel systeem is ontstaan.

Totdat echte commerciële outcomes voldoende volume hebben, mag de systeemstatus technisch groen zijn maar commerciële maturity blijft expliciet `insufficient_evidence`; die status mag niet kunstmatig naar groen worden gezet.

## 9. Implementatievolgorde

1. Canonical schema/runtime inventory + regression tests.
2. Freshness/data completeness contract.
3. Buying-window + latent-problem scoring.
4. Next Best Action + idempotent materialization.
5. Provider/readback reconciliation uitbreiding.
6. Outcome normalization + revenue attribution.
7. Forecast calibration + causal/counterfactual learning.
8. Graph/company intelligence enrichment.
9. Security advisor hardening binnen bestaande contracts.
10. End-to-end production run, readback, learning writeback en scorecard.

Deze volgorde sluit eerst het grootste operationele gat (`actions_materialized`) en bouwt daarna de learningkwaliteit uit zonder commerciële resultaten te verzinnen.
