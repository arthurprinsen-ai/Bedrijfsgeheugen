# CRO → ONE BRAIN: ontbrekende 7-daagse CTA-dekking expliciet tonen in bestaand portaal

**Datum:** 30 oktober 2026 · **Eigenaar:** oorspronkelijke Powerhouse Growth/SEO CRO, Heartbeat en Portal V2 · **Incident:** #4446 · **Geen tweede scheduler/writer**.

## Originele feiten, geen omzetclaim
De service-role-only bestaande view `public.powerhouse_cro_conversion_evidence_v1` meet 7-daagse niet-robot-gemarkeerde pagina-events, CTA-events, dagaggregatie en formulierintenties. Productie op 30 oktober ca. 10:33 UTC: **4.403 `is_robot=false` pagina-events**, **0 persistente CTA-events**, **0 CTA in dagtotalen**, **0 formulierintenties**, **0 gekwalificeerde leads en 0 geverifieerde betaalde orders**. Dit is *geen* 4.403 onafhankelijke menselijke bezoekers: botvlag, consent, browsersessies en meetdekking vragen afzonderlijk bewijs. 2.377 van de pagina-events kwamen alleen al van `/over-ons` over de afgelopen zeven dagen. Het aantal CTA-events is dus een **bewijsprobleem of mogelijk werkelijk ontbrekende activiteit**; de bron kan het verschil nog niet bepalen.

## Concrete bronpariteitsfout
De oorspronkelijke Netlify-API `netlify/functions/powerhouse-cro-other-data.mjs` selecteerde wel `observed_cta_events_7d` en `daily_cta_aggregated_7d`, maar **niet** `human_flagged_pageviews_7d`, `form_submit_intents_7d`, `experiment_assignments_30d`, `matured_treatment_30d` en `matured_holdout_30d`. Daardoor kon het bestaande admin-portaal de werkelijke 7-daagse klikdekking niet naast de 7-daagse bronpopulatie laten zien; 30-daagse `growth_page_daily`-kaarten waren zichtbaar maar geen consistente funneldenominator. Dat maakte het gemakkelijk een 0-click grafiek ten onrechte als 0%-conversie te interpreteren.

## Kleine wijziging, één oorspronkelijke autoriteit
De bestaande `/api/powerhouse-cro-other-data` leest voortaan de aanvullende kolommen **uit dezelfde oorspronkelijke Supabase-view** via de bestaande server-side sleutel. Pure `projectCroMeasurementCoverage` eist niet-negatieve gehele bronwaarden, bronafstemming en apart 7-daags venster:
- **Veel pagina-events en geen CTA:** `CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS`, met oorzaak `CLICK_INSTRUMENTATION_OR_BEHAVIOR_NOT_RESOLVED`. Geen berekening 0%-klantconversie; ratio `null`.
- **Ruwe CTA-events versus dagtotaal verschillend:** `CTA_EVENT_AGGREGATION_MISMATCH`, met expliciete bronreconciliatie nodig.
- **CTA-events consistent waargenomen:** `CTA_EVENTS_OBSERVED_NOT_BUYER_CONVERSION`; eventuele ratio is descriptief event-per-pagina-event, geen bezoekersconversie of experiment-uplift.
- **Bron ontbreekt of ongeldig:** `UNVERIFIED`, niets verzinnen.

De bestaande `portal-v2/modules/andere-data.js` toont de status en brongetrouwe aantallen apart, met waarschuwing bij open bewijslus. Geen nieuw publieksendpoint, CRM, database-view, scraper, AI-model, social publisher, scheduler of browseridentificatie. Dezelfde getekende adminrol, tenantbegrenzing, provider- en betalingsgates blijven staan.

## Herstelpad en echte winstmeting
Eerste verificatie: oorspronkelijke website `primary_cta_click` → Netlify `/api/growth-event` (HTTP 202 betekent duurzaam gequeued, niet al persisted) → originele `growth-drain` → exact event-ID in Supabase `growth_events` → overeenkomstige dagaggregatie `growth_page_daily`. Gebruik consent- en robotfilter, niet een synthetic Playwright-klik als klantconversie. Daarna pas werkelijke gekwalificeerde lead, overeenkomstige afspraak, offerte, betaalde order en `ONE BRAIN` learning application ID. Social wordt per kanaal en postleeftijd vergeleken; LinkedIn persoonlijk heeft reaction-only, geen geverifieerde views. Experiment pas winnaar na minimum volwassen treatment/holdout en echte onafhankelijke uitkomst.

Acceptatie: beschermde Required/BRAIN/CodeQL, exacte main SHA, Netlify READY dezelfde SHA, ingelogde adminreadback met source-aligned 7d aantallen en originele 15-lussenstatus; vervolgens volgende natuurlijke meting die de dekking verandert. Het resultaat kan eerst bewust **AMBER** zijn. Broncode-check is geen omzet- of groei-effectbewijs. Regressie `tests/portal-cro-other-data.test.mjs`.
