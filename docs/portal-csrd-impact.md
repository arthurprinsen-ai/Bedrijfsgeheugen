# Portal V2 — CSRD & Impact

## Doel
`csrd-impact` is de canonieke impactcockpit in Portal V2. De module combineert duurzaamheids-KPI's, CSRD-readiness, acties, evidence en auditnavigatie in dezelfde portal-architectuur als Inzicht, Acties & Impact en Brein & Powerhouse.

## Plaatsing
- Registry: `portal-next/portal-content-map.js`
- Page id: `csrd-impact`
- Sectie: `inzicht`
- Renderer: `portal-v2/csrd-impact.js`
- Styling: `portal-v2/csrd-impact.css`
- Shell-integratie: `portal-v2/page-shell.js`
- Geen legacy tab en geen afzonderlijke demo-pagina.

## Functioneel contract
1. Totaalscore en trend zijn zichtbaar.
2. Domeinen: CO2/klimaat, water, circulariteit, social en governance.
3. CSRD Readiness toont materialiteit, ESRS-datapunten, ketenanalyse en rapportage/audit.
4. Impactacties linken naar `actieve-acties`.
5. Evidence/audit linkt naar `outcomes-evidence` en auditdetail naar `audit`.
6. Sectorvergelijking linkt naar `cijfers-maatstaven`.
7. Klantweergave verwijdert interne evidence-metadata; interne datakwaliteit/evidence mag niet lekken.
8. Tabs filteren de domeinkaarten zonder data te verwijderen.
9. Mobiele weergave blijft bruikbaar en scrollbaar.

## Datacontract
De huidige `DEFAULT_IMPACT_SNAPSHOT` is voorbeelddata en mag niet als runtime- of assurancebewijs worden gepresenteerd. Productiedata moet later via het portal-data/evidence-contract binnenkomen. Claims worden pas `live` wanneer er bron-, timestamp- en validatiebewijs beschikbaar is.

Minimaal productieobject:
- period
- impactScore + delta
- readiness + readinessItems
- metrics per domein
- realtime metrics met bron/timestamp
- social metrics
- actions met owner/status/outcome
- internal evidence metadata voor bevoegde interne rollen

## Audit & borging
- Geen cosmetische complianceclaim: score/readiness ≠ juridische conformiteitsverklaring.
- Elke KPI moet herleidbaar zijn naar bron → berekening → validatie → rapportage.
- Klantweergave is een expliciete safe projection; nieuwe interne velden moeten standaard buiten deze projection blijven.
- Wijzigingen aan registry, renderer of customer projection vereisen Portal V2-tests.
- Geen tweede CSRD-dashboard elders bouwen; uitbreiden gebeurt via deze page id en renderer.
- Closed-loop: signaal → analyse → actie → evidence → outcome → learning/writeback.

## Regressietests
- `portal-v2/tests/csrd-impact.test.mjs`
- `portal-v2/tests/csrd-impact-render.test.mjs`

Fingerprint: `portal-v2-csrd-impact-canonical-dashboard-v1`
