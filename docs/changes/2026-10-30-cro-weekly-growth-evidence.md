# Bestaande Powerhouse/CRO — bewijsvaste weekgroei
Datum: 30 oktober 2026. Fingerprint: `powerhouse|cro|weekly-growth-missing-comparable-closed-periods|20261030-v1`.

## Waargenomen probleem
De bestaande, beveiligde CRO-pagina toonde alleen geaggregeerde 30-daagse websitecijfers. Social CRO vergeleek al met eerdere perioden, maar website → CTA → lead → order had geen vergelijkbare volledig afgesloten weken. In de originele `growth_page_daily` zijn voor 16–29 oktober slechts 11 van 14 kalenderdagen als rijen aanwezig. Een ontbrekende dag is **geen** bewezen nul. De waargenomen 4.398 pageviews in de recente week bewijzen geen unieke bezoekers, geen gecorrigeerde conversie, geen betaalde orders en geen causaal effect.

## Bestaande architectuur, geen extra worker
De originele `netlify/functions/powerhouse-cro-other-data.mjs` projecteert voortaan uit dezelfde read-only `growth_page_daily`-records 7 volledig afgesloten lokale kalenderdagen tegenover de voorgaande 7. `portal-v2/modules/andere-data.js` laat per periode de observaties, richting, procentuele vergelijking en ontbrekende datums zien. Geen nieuwe database, scheduler, client tracking, shadow CRM, publisher of Heartbeat.

Eisen: alle 14 dagen moeten bronrijen hebben; ontbrekende, ongeldige of getrunceerde data wordt `UNVERIFIED`; 0 als baseline geeft géén percentage; weinig pageviews geeft `LOW_SAMPLE_DESCRIPTIVE_ONLY`. `page_views` zijn geen unieke bezoekers. CTA-klikken, geregistreerde leads en geregistreerde orders zijn observaties; gekwalificeerde kopers, betaalde orders en opbrengsten vereisen afzonderlijke provider- en attributiereadback. Vergelijking is descriptief, geen experimentele causaliteitsclaim.

## Enige gesloten lus en groei
Originele bron → CRO-meting → afwijking/meetgat → bestaande Growth/CRO-beslissing en obligation → gecontroleerd experiment → bestaande action/publisher owner → onafhankelijke provider/website/orderreadback → ONE BRAIN outcome learning → aantoonbare toepassing volgende natuurlijke Heartbeat-run. Behoud de bestaande 15-lussenstatus en de zeven CRO-verificatiegates: de trendmodule mag geen statuswinst simuleren. Uitvoeringsdoel: herhaaldelijk verbeteren van echte bezoeken, relevante CTA, gekwalificeerde leads, offertes, betaalde orders en netto omzet, met social bereik en mailantwoorden als ondersteunende indicatoren. Er bestaat geen betrouwbare garantie op monotone groei.

## Test en release
Regression: `tests/brain-cro-weekly-growth-evidence-20261030.test.mjs`. Dit is een broncodekandidaat tot Required/BRAIN/CodeQL, exact protected merge, Netlify exact-main, geauthenticeerde 200/403/401 uitleestest en volgende natuurlijke Heartbeat-cyclus zijn bewezen. Bestaande skill `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`, `AGENTS.md`, System Map, Brain OBSERVED learning en append-only menselijk ledger zijn onderdeel van dezelfde wijzigingen. Bij source-partial blijft alles fail-closed.
