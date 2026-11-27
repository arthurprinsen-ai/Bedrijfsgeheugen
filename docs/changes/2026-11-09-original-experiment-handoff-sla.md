# 9 november 2026 — permanente overdrachtscontrole per origineel experiment

## Doel en reden

Na het live herstel van Windsor-postmetrics naar BRAIN was de zesuurse synchronisatie van 9 november technisch groen (4 exacte bedrijfspostsnapshots). Toch ontbrak een eindcontrole per oorspronkelijke experimenttoepassing; een goede oude meting maskeerde eventueel ontbrekende latere post- of BRAIN-bewijzen. Het portaal en andere agents mogen zo'n globale cronstatus nooit als volledige leerwerking interpreteren.

## Één bestaande keten, geen tweede uitvoerder

De originele `bg-social-metrics-sync` leest bij elk bestaand zesuursmoment maximaal 40 originele `social_learning_applications` van 14 dagen, uitsluitend gevalideerde providerpublicaties met een bestaande `social_posts` company-ID. Een pure helper in de reeds geïmporteerde `linked-company-analytics.mjs` controleert de juiste `social_metric_snapshots` (exact LinkedIn-org, provider-post-URN, onafhankelijke bron, minimaal 24h na publicatie en maximaal 8 dagen) en identieke `social_learning_evaluations` (zelfde application-ID én bron-event) met originele application-receipt. Deze inspectie verzendt niets extern.

Bij een meting die na 78 uur ontbreekt, of een evaluatie/ACK die na 84 uur ontbreekt, geeft de originele runtime `HANDOFF_OVERDUE` met de betrokken postidentiteiten en originele eigenaar/actie; de algemene run wordt niet groen. Normale jonge berichten blijven `WAITING`, niet onterecht rood. De originele Windsor-bronhouder kan brondata herstellen; zesuurse eigenaar koppelt ze, minuut-39 BRAIN verifieert en de bestaande content-orchestrator past hypothese of experiment toe in de volgende natuurlijke post. OAuth of scopes die expliciete menselijke toestemming vereisen worden niet omzeild.

De voortgang is zichtbaar in het bestaande `provider_social_metric_ingest`-runtime-event onder `company_experiment_handoff`, zonder extra tabel of scheduler. Het bestaande social CRO-agentcontract krijgt de harde eis en er is regressiebewijs tegen falsificatie en false-green. Alle besluiten moeten de ontvangende stap + toekomstig effect nog afzonderlijk bewijzen; 183 impressies zijn slechts bereik, geen verkoop of causaal verbeterbewijs.

## Acceptatie

Beschermde GitHub Required en CodeQL → beschermde merge → productiebundel van exact gemergede helper en functie → oorspronkelijke provider readback met getypeerde status → volgende natuurlijke zesuurse controle → volgende contentgeneratie met hergebruik van meet- en leerinformatie. Alleen dan deelketen VERIFIED; complete autonome commerciële groei is niet gegarandeerd en staat apart in issue #4198.
