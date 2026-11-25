# Powerhouse Mijn acties — gerealiseerde waarde op bronbewijs

Datum: 15 oktober 2026  
Obligation-ID: `powerhouse-owner-verified-value-ledger-20261015-v1`  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4413

## Doel
Na de vijfdelige ondernemerservaring en de geverifieerde financiële sturing ontbreekt nog een duidelijk overzicht van werkelijk gerealiseerde waarde. Mijn acties toont nu een aparte, controleerbare waardeprojectie: euro's én uren, gekoppeld aan evidence-IDs en eventueel de oorspronkelijke PH-Pxxx-probleemidentiteit.

## Bron en bestaande architectuur
- Bestaande JWT-gebonden `/api/brain-operating-loop` wordt éénmaal opgehaald via de bestaande besluitclient.
- Alleen `projection.verifiedValue.verifiedValues` telt: de serverprojectie `brain/operating-loop/verified-value.mjs` vereist `executed===true`, `verified===true`, niet-leeg resultaat, evidenceIds én `payload.realised===true`.
- Strikte projectie `tenantId===expectedTenant`, anders geen waarde. Geen fallback naar totaalvelden, legacy outcomes, scenario's, voorgestelde acties of kostenprognoses.
- Unieke ID én proof-unit-deduplicatie: dubbele claims op hetzelfde bewijs worden niet opgeteld. Alleen EUR en uur, nooit bedragen zonder eenheid.
- Geld en tijd blijven gescheiden. Afwezigheid wordt als `—` weergegeven, niet als € 0 besparing. Negatieve correcties blijven mogelijk.
- Aangezien deze recordprojectie niet voor iedere waarde een betrouwbaar tijdstempel bevat, wordt geen claim gemaakt over afgelopen 30 dagen, huidige maand of jaarlijkse opbrengst.

## UI, contracten en verificatie
- Nieuwe `portal-v2/owner-verified-value.js`; `Mijn acties` integreert deze in de bestaande eigenaarspagina.
- Geen extra API-call, worker, Supabase-tabel, providerdispatch of nieuw autorisatiemechanisme.
- Test `tests/portal-v2-owner-verified-value.test.mjs`: tenant mismatch, ontbreken bron, duplicate evidence, EUR/uren scheiding, geen legacy of forecast optelling, XSS.
- Integratieregressie in `tests/portal-v2-owner-operating-system.test.mjs`.
- Volledig acceptatiebewijs vereist Required CI, CodeQL, protected merge, deploy en geauthenticeerde productie-readback.

## Grenzen
Een providerhandeling, goedkeuring of succesvolle synchronisatie is niet automatisch financiële waarde. Buiten de door de canonical Brain server aantoonbaar gerealiseerde registraties worden geen resultaten getoond. De afgeleide UI kan geen ontbrekende klantcontracten of providerautorisaties repareren.
