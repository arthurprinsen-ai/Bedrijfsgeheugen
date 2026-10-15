# Powerhouse Foresight — scenario's in de bestaande klantcockpit

Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420
Fingerprint: powerhouse|portal-v2|cross-domain-foresight|v1

## Doel
De bestaande Portal V2 bevat al een bedrijfssituatie, doelvoorspellingen, scenario's, Brein-operating-loop en runtime observaties. Forecasting wordt een cross-domain beslisfunctie in de bestaande cockpit in plaats van uitsluitend financieel.

## Geïmplementeerde kandidaat
- Eén geïntegreerde Foresight scenariostudio op overzicht en relevante contextschermen.
- Domeindoelen: omzetgroei, EBITDA-marge, cash runway, handmatig werk, bedrijfswaarde, exitgereedheid en restrisico.
- Doel, horizon 30/90/180/365 dagen, basismeting, tegenwind/meewind en gevoeligheidsschuif.
- Historische klantmetingen, lineaire trend, indicatieve band en afzonderlijk wat-als-scenario; bij minder dan 3 verschillende datums verspreid over ten minste 14 dagen geen forecast.
- Doorklik naar bestaande bron/actiepagina, geen nieuwe database, geen parallelle scheduler.
- Authenticated Brain runtime observaties worden uitsluitend uit de tenantgebonden portaalcontext als operationele context getoond; geen impliciete klanttoekenning van globale Powerhouse forecasts.

## Herkomst en grenzen
Histories: portal.business_context.goal_targets.<goal>.history, portal.goal_history, portal.metrics.history en portal.business_context.goal_history. Model: brain/context/goal-forecast-engine.mjs, portal-v2/foresight-scenario-studio.js.
Het model is een **exploratieve statistische trend**, niet onafhankelijk gevalideerd of backtested. De band is indicatief; percentages zijn aannames. Afhankelijkheden betekenen nog geen kwantificeerbare, causale of gerealiseerde waarde. Geen doel heeft een numerieke forecast zonder echte klantgeschiedenis.

## Nog vereist voor volledige all-source voorspelling
Getoetste serverprojection per tenant voor aanvullende Powerhouse, Brein en Heartbeat signalen, van juiste eigenaar, versheid, backtesting en onafhankelijke validatie voorzien. Globale marketingforecasts blijven uitgesloten.
CI, protected merge, productie-deploy, geauthenticeerde tenant-readback op de exacte GitHub-SHA. Geen groenrapportage zonder bewijs.

Regression: tests/powerhouse-contextual-foresight-studio.test.mjs
