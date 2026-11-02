# Eén zichzelf verbeterende Powerhouse-lus — uitvoercontract (voorstel)

Datum: 2026-10-25. Status: **candidate / niet live bewezen**.

## Doel en bestaande autoriteit

Maak Brain, Heartbeat, Portal, Growth en delivery één **bewijsvaste verbeterlus** die aantoonbaar klantwaarde, aanvragen, offertes, gewonnen klanten en gerealiseerde omzet verhoogt. Dit document is geen autorisatie voor een tweede scheduler, queue, agent, waarheidstabel of publicatiekanaal. Hergebruik de bestaande Powerhouse Daily Self Evolution, Repository Janitor, Brain failure registry, learning/skill projection, canonical obligations en protected release.

Deze acceptatie-eisen vullen de bestaande `.agents/skills/powerhouse-continuity/SKILL.md` en `AGENTS.md` aan; bij tegenspraak prevaleren hun veiligheids-/bewijspoorten en de canonieke runtimecontracten. Implementatie aan agents, skills of workflows vergt dezelfde-PR systeemkaart-update en technische tests.

## Eén cyclisch proces

`observe -> correlate -> prioritize -> decide -> act -> verify -> attribute -> learn -> project skills -> evaluate -> repeat`

Iedere stap deelt dezelfde `obligation_id`, tenant-scope, lineage en idempotency key. Sla bij interrupt een hervatbaar checkpoint op; start geen concurrerende lus.

1. **Observe:** ingest met toestemming en geldige toegang: web/SEO/analytics/CRO-events, zoekintentie, herhaalbezoeken, formuliertrechters, contactvoorkeuren, providerbevestigde social-content en interacties, replies en opt-outs, klantportalacties, relevante openbare bronnen en geverifieerde factuur-/betalingsstatus. Registreer bron, tijd, tenant, consent-/lawful-basis, volledigheid, provider-ID, bewijs-URL en freshness. Geen persoonsgegevens uit private kanalen als openbare leadbron behandelen.
2. **Correlate:** koppel gebeurtenissen alleen via geldige, doelgebonden identificatoren; anoniem gedrag blijft anoniem. Onderscheid eerste bezoek, terugkeer, actieve vraag, toestemming, gekwalificeerde kans, offerte en betaalde klant. Ontbrekende identificeerbaarheid is geen uitnodiging om die te omzeilen.
3. **Prioritize:** score per kandidaat = geschatte incrementele klantwaarde × geschatte kans × bewijsvertrouwen minus uitvoeringskosten, risico en verzadiging. Vermeld onzekerheid, verklarende features en de nog ontbrekende informatie. Verhoog score niet op basis van uitsluitend likes/views.
4. **Decide:** kies max. één eigenaar per probleem en begrensde veilige actie. Klantportal toont: extern signaal, relevantie voor die specifieke klant, bron en datum, aanbevolen actie, verwachte impact, onzekerheid en toestemming/goedkeuring waar nodig.
5. **Act:** hergebruik bestaande publicatie/outreach/website/portal workflows. Sta laagrisico-experimenten binnen autorisatie toe; content, aanbiedingen of outbound blijven onder providerregels, marketingtoestemming, duplicate protection en geldende releasegates. Geen autonome verzending aan onbenaderbare scanregistraties.
6. **Verify:** bij publicatie exact final-media-ID plus onafhankelijke provider-readback; bij deploy exact SHA, Required/CodeQL, geldige preview, beschermde merge en productie-readback. Bij outbound evidence van echte verzending, niet alleen ACK. Voor betaling bewezen transactionele registratie en onafhankelijke reconciliation.
7. **Attribute:** bewaar funnel `impression -> session -> engaged -> consented lead -> qualified lead -> meeting -> proposal -> win -> paid -> retained`. Rapporteer tellers, noemers, cohorten, conversiepercentages, kanaalattributie met onzekerheid en euro's uit gerealiseerde waarde. `0` proven paid orders blijft `0`, nooit geschatte omzet als gerealiseerd presenteren.
8. **Learn:** voor iedere actie outcome, counterfactual/baseline, hypothese, effectgrootte, steekproef, confidence, failure fingerprint, preventieregel, regressie, rollback en opvolgactie vastleggen in bestaande Brain/learning lineage. Gebruik holdouts/sequentiële evaluatie waar voldoende data; bij weinig data expliciet exploratief, niet causaal bewezen.
9. **Project skills:** compileer bewezen lessen via bestaande `scripts/brain/powerhouse-skill-projection.mjs`; voer bestaande daily self-evolution evals uit. Een candidate prompt/skill-update wordt alleen actief na regressies, veiligheidstoets, canonieke System Map/human docs writeback en protected promotion. Detecteer stale projection en behandel als open verplichting.
10. **Repeat:** bestaande Heartbeat plant op basis van freshness, impact en SLA de volgende veilige actie, begrensd met retries/backoff en dedupe; bij autorisatie-/providerblokkade een concrete escalatie binnen dezelfde obligation. Geen fictieve gegarandeerde uptime of altijd-groenstatus.

## Betere beslissingen, niet alleen méér agents

- **Opportunity agent:** signaal → bewijskwaliteit → koopintentie → bereikbaarheid → concrete next-best-action → orderkans; maakt geen niet-geconsenteerde lead.
- **CRO agent:** analyseert bezoek- en terugkeercohorten, formulieruitval, snelheid, copy, UX en aanbod; publiceert pas na relevante test/releasegates en meet lift tegen een baseline.
- **Content/distribution agent:** gebruikt echte zoek- en klantvragen; meet providerbevestigde distributie, kwalitatieve reacties, inbound leads en downstream omzet. Niet op oppervlakkige engagement optimaliseren.
- **Customer advisory agent:** toont per tenant prioriteiten, externe risico/kans, brondata en uit te voeren acties; autonoom alleen binnen machtigingen. Cross-tenant data mogen nooit lekken.
- **Revenue agent:** sluit conversies op echte offerte/order/factuur/betaling met reconciliation; nooit betaling fabriceren.
- **Reliability/learning agent:** dedupeert incidentfingerprints, test structurele fix, hergebruikt oude lessen en voorkomt regressies via preflight. Maakt geen tweede remediation owner.

Dit zijn **verantwoordelijkheden binnen bestaande agent-/workflowtopologie**, geen opdracht om zes nieuwe agents of schedulers te registreren.

## Contract voor een auditbare actie

Iedere materiële actie heeft: `obligation_id`, `tenant_scope`, `trigger_source`, `source_observed_at`, `consent_basis`, `hypothesis`, `baseline`, `decision_reason`, `expected_value_range`, `confidence`, `owner`, `idempotency_key`, `attempt`, `provider_evidence`, `exact_sha_or_deploy`, `result`, `actual_value`, `learning_fingerprint`, `skill_projection_version`, `next_action`, `next_review_at`. Waarde `unknown` waar bewijs ontbreekt, nooit ingevulde schijnzekerheid. Geen onnodige persoonsgegevens of secrets in logging.

## Dagelijkse cockpit, exact meetbaar

- **Coverage:** percentage actieve bronnen met actuele geslaagde provider-readback, en afzonderlijk de bronnen met stale/missing data.
- **Commercial:** nieuwe bereikbare leads met geldige toestemming, MQL/SQL, meetings, offertes, wins, betaalde omzet en attributie-unknown; tegen voorgaande vergelijkbare cohorten.
- **Portal value:** klanten met aantoonbaar bekeken én opgevolgde adviezen, time-to-action, outcome-lift en onopgeloste klantvragen.
- **Autonomy:** veilig zelfstandig afgeronde obligations / daarvoor in aanmerking komende obligations; blokkades met owner, SLA en volgende actie.
- **Learning:** bewezen incidentherhalingen, regression coverage, skill projection freshness, evaluaties die beter of slechter scoren ten opzichte van baseline.
- **Trust:** provider-/betaling-/releasebewijs compleet; consent/RLS/tenant/security failures, geen vermenging van candidate en live.

Rapporteer `GREEN` uitsluitend per daadwerkelijk bewezen controle. Laat ketenstatus `RED/UNKNOWN` zolang noodzakelijke externe bewijs-, omzet- of security-controls ontbreken.

## Acceptatiecriteria voor implementatie

1. Eén bestaand cadanspad voert een volledige cyclus uit met duurzame lineage en herstel na onderbreking.
2. Test met echte én ontbrekende data: verkeerde tenant, ontbrekende toestemming, herhaald anoniem bezoek, gelijke event-ID, provider-ACK zonder readback, sociale dubbele verzending, zoekbronfout, niet-betaalde order, stale skill projection.
3. Geen nieuw agentregister, tweede scheduler of waarheidstabel; aantoonbaar hergebruik van canonical Brain/Heartbeat en System Map.
4. Eén gedocumenteerde A/B- of quasi-experimentele CRO-beslissing met baseline en voldoende bewijs óf expliciete onzekerheid.
5. Per klantportaaladvies traceerbare externe bron en concrete next-best-action, inclusief permission check.
6. Dagelijks auditbaar scoreboard met afzonderlijke outcome- en bewijsstatus; alle rode verplichtingen zichtbaar.
7. Same-lineage protected PR, bij wijzigingen aan runtime/skills ook System Map update, Required, CodeQL, eventuele Supabase-preview, provider-/productiereadback en een geverifieerde learning→skill-projectie.

## Eerstvolgende uitvoering

Koppel bovenstaande acceptatiecriteria aan de **bestaande** Brain/Heartbeat/Growth-owner; inventariseer de ontbrekende velden en tests in de huidige pipelines. Implementeer alleen de delta, in dezelfde bestaande remediation/PR-lineage waar die al bestaat. Dit document op zichzelf betekent niet dat de dagelijkse autonome groeimotor of betaalde omzet reeds is bewezen.
