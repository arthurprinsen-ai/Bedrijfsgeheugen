# 25 oktober 2026 — Eén commerciële kwalificatie- en leerlus

**Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Fingerprint:** `growth|daily|latent-demand-2900-without-buyer-proof|20261025-v1`  
**Owner:** existing Growth Intelligence daily + Powerhouse commercial Heartbeat; geen aparte commerciële executor.

## Gecontroleerde oorzaak
De productie bevat 837 open opportunities (618 opportunityfase, 219 signaalfase). Geen van deze 837 heeft een positief bewezen expected_value_eur-bedrag in de canonieke opportunity-rij. Tegelijk bestonden 9 offerte-inzendingen (4 getekend), maar de sales-outcome- en revenue-truth-spine leverde 0 positief onafhankelijk gerealiseerde euro's. Een getekende offerte is zonder onafhankelijke opdracht- en betaalreadback geen gerealiseerde omzet.

De dagelijkse `growth-intelligence-daily.mjs` kende nieuwe latent-demand opportunities een `€2900` minimum toe op basis van algemene engagementdata, zonder voor die account bewezen behoefte, passende aanbieding, beslisser, inkoopproces of echt koopgedrag. Daarmee konden score en verwachte commerciële waarde groter lijken dan de werkelijke bewijsbasis.

## Implementatie in bestaande lus
- De bestaande `powerhouse_opportunities`-rijen worden op `opportunity_key` geanalyseerd. Het bestaande `need-discovery` model bepaalt welke antwoorden ontbreken.
- Iedere kandidaat valt in `RESEARCH_REQUIRED`, `DISCOVERY_CANDIDATE`, `PROPOSAL_CANDIDATE`, `PROPOSAL_FOLLOW_UP`, `ORDER_OBSERVED` of `NO_CONTACT`. Geen externe actie zonder bestaande contact-, consent- en provider-gates.
- Probleem, bedrijfsimpact, timing, product-fit, beslisser, budget, first-party vraag, order- en betaalbewijs worden afzonderlijk als bewijs-gaten vastgelegd.
- Alleen echte opportunity-matched en bron-geverifieerde verzoeken, voorstellen, orders en betaalbewijzen tellen. Twee events met één betalingsbewijs tellen eenmaal; conflicterende betaalbedragen worden niet bij de omzet geteld.
- Daily Brain `commercial-readiness:<date>:<key>` bevat status, eerstvolgende veilige actie, ontbrekende gegevens en scheiding tussen voorgesteld en uitgevoerd. Dagelijks geroteerde research-items worden naast echt urgente cases getoond; geen nieuwe scheduler of parallelle database.
- Portfoliovoorspellingen starten niet op likes of ongedekte financiële hypothesen. Een onbekend bedrag is `null` in advies. **Productie SQL `powerhouse_opportunities.expected_value_eur` en `expected_revenue_value` zijn echter NOT NULL** en krijgen uitsluitend database-compatibele **0-sentinels** met `economic_unknown_database_zero_sentinel=true` en `economic_value_verified=false`, niet fictief gewaardeerde kansen.

## Afbakening en veiligheid
De bestaande `netlify/functions/growth-intelligence-daily.mjs` blijft dagelijks om 06:00 UTC lopen, en gebruikt alleen huidige Brain-, opportunities- en sales-outcome-authorities. Bestaande Heartbeat blijft eigenaar van concrete uitvoering. Geen nieuwe providerberichten, queue, cron, bezoekerprofilering zonder bron, ongeverifieerde kopers, nieuwe orderclaims of directe productie-promotie. Het dagoverzicht toont `commercial_revenue_verified_by_this_run=false` totdat onafhankelijk resultaat kan worden herleid. `OBSERVED` leermomenten worden niet als uitgevoerd/gevalideerd opgeslagen.

## Test en vrijgave
- `tests/brain-commercial-opportunity-evidence-20261025.test.mjs`: onafhankelijke bevestiging, juiste opportunity, bronouderdom, suppressie, dubbele betalingsreceipts en conflicterende bedragen.
- `tests/brain-commercial-opportunity-daily-integration-20261025.test.mjs` en `tests/growth-intelligence-daily.test.mjs`: bestaande dagrunner, Brain-writeback, zero-sentinel en niet-fictieve kwalificatie.
- De tests draaien in de bestaande Required job; CodeQL en beschermd main blijven vereist.
- **Niet live bewezen:** exacte-head CI/CodeQL, beschermd merge, corresponderende Netlify deployment, echte geplande dagrun en readback van Brain inclusief onafhankelijke aantoonbare klantuitkomsten en omzet. Productie 'groen' en autonome omzetstijging mogen niet op de bronbranch alleen worden geclaimd.

## Volgende autonome beslisregel
Rangschik betaalde order / gevalideerde offerte / bevestigd klantverzoek boven algemene interesse. Gebruik ieder ontbrekend bewijs als onderzoekstaak in dezelfde Growth-cyclus. Meet de overgang van verzoek → offerte → order → betaling met provider-ACK en exacte lineage. Promote een verbeterregel alleen met vergelijkbare baseline, onafhankelijke outcome en beschermde CI/security. Behoud iedere mislukte write als canonieke fout-fingerprint met oorzaak en regressietest.
