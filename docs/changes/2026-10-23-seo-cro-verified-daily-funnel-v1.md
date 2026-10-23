# Dagelijkse SEO → CTA → klant → omzet-analyse in de bestaande Growth Intelligence

Datum: 2026-10-23. Status: **protected candidate; productie en opbrengst onbewezen**.

## Oorzaak
De bestaande dagelijkse Netlify-functie prioriteerde zoekwoordkansen, bedrijfscontext en omzet, maar reconcilieerde niet per canonieke commerciële pagina de GSC-vertoningen/CTR met eigen privacyarme `growth_events` en geverifieerde `growth_outcomes`. Bovendien wees zijn PostgREST-authenticatiefallback naar een niet-ingestelde Netlify-variabele: `BG_PORTAL_EU_SERVICE_ROLE_TOKEN`; de al bestaande en in deze audit project-gematchte `SUPABASE_SERVICE_ROLE_KEY` werd niet gebruikt.

## Gerichte correctie
- De bestaande `growth-intelligence-daily.mjs` draait op de **bestaande** Netlify 06:00 UTC-schedule. Geen nieuwe scheduler, crawler, tenantdatabase, trackingcookie, betaalde SEO-run of publicerende agent.
- De bestaande EU Supabase-URL gebruikt eerst de bestaande expliciete Growth-service-credentials, en als fallback uitsluitend de reeds geconfigureerde service-role JWT, met een **fail-closed role- en projectrefcontrole** alvorens de token naar PostgREST kan gaan.
- Dagelijks wordt een begrensde read-only steekproef geladen: maximaal 2.000 GSC-rijen en 2.500 events uit maximaal 35 dagen; omzetuitkomsten volgen de bestaande canonieke groeidataset.
- `tools/seo-growth/daily-conversion-planner.mjs` leest `site/seo-order-map.json`, kijkt alleen naar bestaande money-/pillar-intenteigenaren, dedupliceert GSC-dag/query, weigert onvolledige/afgeknotte meetwindows en scheidt ontbrekende data van gemeten nul.
- Minimaal 50 pageviews én 15 engaged views bij CTA-problemen, of 200 GSC-vertoningen bij CTR-/rankingproblemen. Frisse signalen zijn verplicht; maximaal drie geordende observaties per dag.
- Per materiële detectie wordt een bestaand `brain_records`-record met inputbewijs, rollbackvoorwaarde, expliciete **REJECTED_WITH_EVIDENCE** en reden `NO_SAFE_REVERSIBLE_CHANGE` geschreven zolang de concrete geteste challenger en beschermde productie-uitvoering ontbreken. Dit is geen publicatie of bewijs van conversielift.
- Het bestaande dag-scorecard rapporteert aantal getoetste pages, bronversheid, kandidaatobservaties en nul **geverifieerde** sitewijzigingen. Omzet komt uitsluitend uit geobserveerde uitkomsten.
- De uitvoeringsfase gebruikt de canonieke website-PR/Required/CodeQL/Netlify-provider-readback; nooit een directe write naar main of een extra cron. Zodra een geteste veilige challenger met bewijs beschikbaar is moet die binnen dezelfde bestaande delivery-lineage worden uitgevoerd; een tijdelijke CI-storing is geen grond om definitief te verwerpen.

## Productieacceptatie
1. Node-regressies en de bestaande volledige Required/CodeQL-controles groen op de **exacte** PR-head.
2. Beschermde merge + Netlify-gepubliceerde SHA gelijk aan de merge-SHA.
3. Aantoonbare 06:00 UTC-trigger en terugleesbare Brain-scorecard plus bronversheid en niet-nul steekproef óf eerlijk `MISSING_OR_STALE`.
4. Geen extra cron; ontbrekende echte GA4/GSC/checkout/CRM-resultaten blijven open als bewijsgat.
5. Een gerealiseerde klant en omzet worden pas geteld na onafhankelijke checkout-/order-/billing-readback.

Geen belofte van dagelijks een pagina wijzigen: het dagelijkse **besluit** is verplicht, maar zonder bewijs moet de veilige uitkomst expliciet niet publiceren zijn.
