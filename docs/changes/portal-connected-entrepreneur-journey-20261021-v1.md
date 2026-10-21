# Portal V2 — acht gewenste resultaten als één ondernemersreis

**Fingerprint:** `portal|eight-outcomes|connected-entrepreneur-journey|v1` · **Parent:** [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547) · **Implementatie:** [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585) · **Afhankelijke E2E-audit:** [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Gebruikersreis
Frisse Blik → eigen geauthenticeerde scan/profiel → ondernemersdoel → bronbetrouwbaarheid → precies één eerstvolgende stap → bestaande cockpit en Winstnavigator → relevante afgeleide pagina's → Brain-ACK → afzonderlijk bewezen uitvoering en financiële/operationele uitkomst. Een gemarkeerde afhankelijke pagina is géén doorgerekend resultaat. Een trend/sensitiviteit is géén gerealiseerde winst. Wanneer data ontbreken, blijft de waarde onbekend.

## Wat de huidige kandidaat daadwerkelijk toevoegt
1. **Frisse Blik:** de reeds bestaande beveiligde /api/portal-scans-claimroute plus historie wordt hergebruikt zonder opnieuw antwoorden in te typen. Claim van een anonieme scan blijft een expliciete geautoriseerde actie: geen onveilige auto-claim naar een willekeurig tenantaccount.
2. **Doel:** bestaande `portal.business_context` en canonical BusinessInput/Brain ACK. Alle eerdere doelen blijven bewaard.
3. **Echt versus demo:** uitsluitend authenticated stateClient-snapshot; private journey en grafieken verdwijnen bij logout/tenantwissel; geen klantwaarde uit demo- of managementbestanden.
4. **Next best:** bestaande `buildEntrepreneurHomeModel` kiest één vervolgstap; voorstellen vereisen healthy evidence en bronreferenties.
5. **Cockpit + Winstnavigator:** bestaande `buildOwnerOperatingModel` en `buildWinstnavigatorModel` komen uit dezelfde tenantcontext; de voorheen niet gemounte Winstnavigator is in het originele V2-portaal gemount met CSS en een homepage-CTA. De navigator start op het primaire ondernemersdoel.
6. **Pagina's:** `journeyGuidance` biedt betekenisvolle context op elke route in `PORTAL_PAGE_INDEX`, zonder elk specialistisch formulier te vervangen.
7. **Doorwerking:** bestaande `bg:portal-impact`, `bg:portal-brain-synced`, `domainState.flush` en `/api/portal-business-input` maken betrokken pagina's en ACK zichtbaar. De canvas belooft nooit een financieel effect of actuele externe koppeling zonder apart bronbewijs.
8. **Scenario en voortgang:** bestaande trendberekening met minimaal drie recente observaties over minimaal 14 dagen, gevoeligheid en horizon, echte tijdreeks in Winstnavigator; bij onvoldoende historie is er géén voorspelling.

## Bronnen en bevoegdheden
| Provider | Canonieke rol | Wat de UI nooit mag afleiden |
| --- | --- | --- |
| Supabase | RLS-gecontroleerde klantstate, bronregis­tratie, Brain/Powerhouse-uitkomsten | Een geslaagde deploy is geen twee-tenant klantacceptatie |
| Brain / Powerhouse / Heartbeat | Ontvangen, contextualiseren, beslissen, effect- en bronstatus terugleveren binnen bestaande klantautorisatie | Een bronstatus is niet automatisch een resultaat of gegarandeerde Heartbeat-SLA |
| GitHub | Beveiligde implementatie, regressies, obligations, CodeQL, release-evidence | Repositorykennis is geen actuele privébedrijfs-KPI |
| Netlify | Exacte productieversie, function endpoints en build/readback | HTTP200 bewijst niet dat elke tenantverwerking slaagt |
| Notion | Menselijke documentatie, architectuur en leerregistraties | Documenttekst is niet de live tenantfeed |
| Composio / andere externe connectors | Bestaande, bevoegd gecontroleerde source/side-effect providers met eigen receipts | Geen verborgen tokengebruik of ongeautoriseerde cross-tenant synchronisatie |

## Complete operationele acceptatie — niet fictief sluiten
- Exact-head Required, BRAIN/CodeQL, protected merge, Netlify current-ready exact commit.
- Echte ingelogde tenant A: bewaarde Frisse Blik claim, bronreadback en oorspronkelijke antwoorden zonder herinvoer; doelwijziging → canonical state + Brain ACK → herlogin → dezelfde waarde op afhankelijke pagina.
- Echte ingelogde tenant B met andere invoer: geen data, doelen, scenario's of event-feedback van A.
- Representatieve veelveldmutaties volgen veld → bronrevision → Brain/Powerhouse/Heartbeat → pagina-invalidation → echte forecast/bronreadback; verificatie geldt per bron en veld, niet automatisch platformbreed.
- Scenario's met voldoende historie tonen onzekerheid en bronkwaliteit; zonder historie onbekend. Onafhankelijke geverifieerde outcome verschilt van planning, aannames of provideractiviteit.
- Reële touch/keyboard/mobiele weergaven 320/390/1024/1440 px, WCAG 2.2 AA-audit, lage databelasting en 504/time-out negatieve testen.
- Nog open onder #4215/#4547: volledige paginavelddekking, alle externe connector- en AI-modelbeschikbaarheid, echte 2-klantvalidatie. Geen claim dat deze frontend-PR al die backendafhankelijkheden voltooit.

## Architecturale borging
Canonical System Map `portal-eight-outcomes-connected-journey-v1`, bijbehorende `brain/learning/2026-10-21-portal-connected-entrepreneur-journey-v1.json`, `.agents/skills/powerhouse-company-intelligence-os/SKILL.md` en append-only event. Geen extra scheduler, DB-migratie, marketingmail, Composio-side effect of Notion-replicatietabel.

**Huidige leverstatus:** beschermd kandidaat, geen productieclaim tot provider-readback.

## Productierelease-readback — 21 oktober 2026

De beschermde [PR #4588](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4588) is 2026-10-21T09:26:38Z gemerged in exacte main-SHA `20abd485e7956bf8f1aa541a52076533269e4569`. Verplichte kandidaatcontroles inclusief Required, Portal, Backend, CodeQL, Netlify-buildpariteit en 265 pagina's × drie formaten browseracceptatie waren terminal groen.

Rechtstreeks bevestigde huidige Netlify-productieversie: site `fd527056-493a-4d8a-8125-d00370104fa3`, deploy `6ad88550dd76a312a37b77fc`, branch `main`, context `production`, `state=ready`, dezelfde `commit_ref=20abd485e7956bf8f1aa541a52076533269e4569`, gepubliceerd `2026-10-21T09:28:54.780Z`. Daarmee is de **release provider-live bewezen**; de eerdere kandidaatstatus in dit document beschrijft alleen de ontwikkelfase.

De **volledige bedrijfsketen is NIET geaccepteerd** zonder echte aparte geauthenticeerde tenant A/B, originele scans, mutatiegeneration + Brain ACK, financieel modelresultaat, gerealiseerde outcome en connectorproviderbewijs. Rechtstreekse Supabase-aggregaten op 21 oktober: één portaltenant, nul connector-definities, nul connector-uitvoeringen en nul financiële forecastrecords. Issues [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215) en [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547) blijven open voor de niet bewezen klantkant; geen fake green en geen veiligheidsbypass.

## Scan-score waarheid: aanvullende bronreparatie (21 oktober 2026)
Oudere `renderBedrijfslekIntelligence`-kaarten gebruikten `Number(scan?.score)`. JavaScript zet `null` en lege tekst om in `0`, waardoor een geverifieerde maar scoreloze nulmeting verkeerd als **0/100** kon verschijnen. De oude kaart accepteert daarom uitsluitend expliciet aanwezige numerieke scorewaarden in 0–100; de doelgestuurde homepage behield de correcte onbekendstatus al. Regressie test `portal-v2/tests/entrepreneur-journey.test.mjs`, gekoppeld aan de bestaande Brain-replay. Dit is geen bewijs van onafhankelijke twee-tenant acceptatie of externe connectors.
