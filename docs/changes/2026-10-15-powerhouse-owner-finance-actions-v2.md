# Powerhouse V2 — geverifieerde financiën en besluiten

Obligation-ID: `powerhouse-owner-operating-finance-and-decision-20261015-v2`  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4407

## Integratie (bestaande codebase)
1. **Mijn bedrijf** haalt tenantgebonden financiële bronnen op via de bestaande onafhankelijke forecast-acceptatie `/api/portal-forecasts`. Geen automatische data-import, SQL credentials, frauduleuze KPI's of forecasts uit generieke signalen.
2. De geauthenticeerde serverrespons draagt `tenantId`; bij verschil met een bekende klantscope wordt geweigerd. Cliënt valideert identificatie, minimaal zes historische observaties, bron, periode, backtest-reviewstatus, niet toekomstige update en maximal 30 dagen ouderdom. Laatste *historische* omzet/marge en eerstvolgende kasprognose zijn apart gelabeld. Er is geen bewering dat de historische periode de lopende maand is.
3. **Mijn acties** leest op gebruikersinitiatief dezelfde Canonical Brain `/api/brain-operating-loop` als de bestaande Company Cockpit. Expliciete `APPROVE`/`REJECT` gaan uitsluitend via `/api/company-decision` met tenant/JWT, verwachte status, idempotency en backendrollen. De interface laat succes slechts zien bij veranderde, opnieuw gelezen Brain-projectie. Geen provider-send of werkelijke uitkomst wordt afgeleid uit een goedkeuring.
4. De vijf links op het overzicht openen het overeenkomstige tabblad zonder tweede menu of eigen localStorage.
5. De data blijft fail-closed bij ongeldige JWT, ontbrekende forecast, incomplete bronregistratie, verlopen verificatie of time-out.

## Acceptatie
- `tests/portal-v2-owner-operating-system.test.mjs`
- `tests/portal-v2-owner-financial-truth.test.mjs`
- Bestaande `tests/portal-contextual-forecast.test.mjs` en `tests/brain-portal-v2-experience-contract-v2.test.mjs`.
- Beschermde Required, CodeQL, Netlify, merge en geauthenticeerde release-readback blijven verplicht.

## Nog niet als voltooid claimen
- De datawarehouse-/Supabase-tijdreeks en alle klantcontracten zijn niet door deze UI-wijziging aangemaakt.
- Geen autonomous outreach, financiële binding, contractwijziging of provideractie vindt via de nieuwe knoppen plaats.
- Supabase-time-outs en authenticatie/prod-readback moeten afzonderlijk met providerbewijs hersteld worden.
