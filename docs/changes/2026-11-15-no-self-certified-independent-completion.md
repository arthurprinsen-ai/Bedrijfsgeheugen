# ONE BRAIN — onafhankelijke materiaalafronding mag nooit zelfverklaard worden

Datum: 15 november 2026. Bestaand P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Gecontroleerde bronfout
De oorspronkelijke `tools/outcome-obligation-runtime.mjs::evaluateOne` liet `evaluateCompletion` oordelen. Wanneer uitsluitend `OBLIGATIONS_COMPLETE` ontbrak, schreef **dezelfde** Outcome Obligation Runtime zelf `producer=OUTCOME_OBLIGATION_RUNTIME`, `independent=true`, `accepted=true`, `exactProduction=true` en riep de supervisor opnieuw aan. De bron hiervoor was `completionContext.materialObligations`, ook wanneer die leeg was of alleen door de aanroeper als `VERIFIED` was aangeduid. Dezelfde actor kon daardoor zijn eigen ontbrekende onafhankelijkheidsbewijs scheppen.

Native Supabase controle op 15 november 2026 om 11:14 UTC: **328** `OBLIGATIONS_COMPLETE`-records met deze producer/flags, uit 16–25 september. Dit is bewijs dat het oude patroon in productie voorkwam, *niet* dat iedere achterliggende echte actie fout of fictief was. Bestaande bronrecords zijn append-only; geen historische overschrijving en geen massale closing.

## Correctie in dezelfde bronketen
Verwijder alleen de automatische `OBLIGATIONS_COMPLETE` writer en bijbehorende tweede supervisieronde uit de **originele** runtime. De supervisor blijft bestaan en schrijft zijn `SUPERVISOR_DECISION` nog steeds `independent=false,accepted=false`, met exact ontbrekende `required_evidence`. Zelfs als alle andere beschermde/providerevidence is aangeboden, of `materialObligations=[]` dan wel `[{status:VERIFIED}]`, blijft `LIVE_VERIFIED` onwaar totdat reeds onafhankelijk gelezen bron- en consumerbewijs is gekoppeld. Geen vervangende fake producer, nieuwe scheduler, queue, migratie of provideractie.

Original Reliability en Data Quality agents, de bestaande recovery-proof skill, dezelfde teststraat, ONE BRAIN-leerrecord en development ledger borgen dit permanent. Het onafhankelijke materiaalbewijs moet van de originele geautoriseerde bron/producer komen, exact op `obligationId`, `candidateIdentity` en `productionIdentity` gekoppeld. De historische 328 blijven zichtbaar en krijgen alleen na echte onafhankelijke producentreadback een inhoudelijk oordeel.

## Acceptance
Protected exact-head Required + CodeQL + originele System Map, Netlify preview, beschermde merge, Netlify published exact SHA en natuurlijke originele supervisor-run met `OBLIGATIONS_COMPLETE` nog open bij ontbreken onafhankelijk bewijs. Negatieve regressie simuleert de oude false-green route. Een live codefix is niet hetzelfde als 328 herbeoordeelde records of een bewezen commerciële closed loop.
