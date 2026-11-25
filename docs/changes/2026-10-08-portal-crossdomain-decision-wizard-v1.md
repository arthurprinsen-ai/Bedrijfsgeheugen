# Aanvullende uitwerking — Bedrijfsgeheugen klantportaal
Datum: 8 oktober 2026. Canoniek issue #4215; PR #4221. Aanvulling op de inmiddels op main opgenomen portaal-brede regels.

De bestaande main-versie bevat nu native invoerinventaris, MTO, AI-governance, CSRD, personeels-, financiële, commerciële en operationele risico's, due diligence, hypotheses, regelgeving, uitvoering, financiële scenario's en de correctie van de wijzigingenwizard. Deze wijziging **vervangt die basis niet**.

Nieuwe gerichte contextkaarten voor: ontbrekende uurkostenbasis, financieringsruimte bij gerapporteerde netto-schuld, vacatures, lange procestijd, lage productieve bezetting, onderzoek zonder herkomst, lage AI-governancevolwassenheid, strategische bevinding zonder eigenaar, canvas zonder eigenaar, besluit zonder eigenaar, doel zonder streefwaarde en mislukte connector.

Elke kaart gebruikt bestaande tenantstate en geeft prioriteit, herkomst, geraakte pagina's, een expliciete volgende actie en een voorstel op de bestaande roadmap. Geen nieuwe Brain, datastroom, connectoradapter of automatische provideruitvoering. Ontbrekende klant- of wetgevingscontext mag geen verzonnen financieel effect, juridische constatering of live groenstatus genereren.

De huidige wijzigingenwizard op main gebruikt al de juiste `set('portal.changes.items',items)` plus `flush()` en idempotentie. PR #4221 laat die file onaangeroerd; regressie bewaakt het contract.

Overzichtspagina toont ook de klantgerichte contextkaarten (afgeleid uit dezelfde state). Alle contextkaarten zijn voorstel ter beoordeling; er wordt alleen een roadmap-item aangemaakt na expliciete klantactie.

Verificatie: `node --test portal-v2/tests/cross-domain-complementary-gaps.test.mjs` via root Brain wrapper. Protected merge, exact-SHA deployment en geauthenticeerde echte klantinput→Brain→pagina-readback zijn afzonderlijke bewijsgates. Baseline DOM-check voor afgeschermde compliancepagina faalde op eerdere productiereleases en mag niet door het versoepelen van toegang worden omzeild. Volledige legacy/connector/extern bronverwerking blijft issue #4215.
