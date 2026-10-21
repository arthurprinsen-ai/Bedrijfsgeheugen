# Herstel bestaande BRAIN-testsyntax — 21 oktober 2026

Obligation: `ci-inherited-brain-parser-syntax-20261021`. Parent: [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), related portal [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573) / [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Exact inherited backend evidence: [job 119072398429](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582/job/119072398429).

## Vastgestelde oorzaken

1. `tests/brain-external-commercial-heartbeat-v1.test.mjs` eindigde met drie ongeldige uitvoerbare Markdown-regels van 7 oktober (een verouderde resultaatnotitie); de Node-loader gaf `Unexpected number` voordat de bestaande Heartbeat-tests konden draaien. Die notities staan hieronder als historische bronnotitie, niet als nieuw bewijs.
2. `tests/supabase-migration-history-terminal-closure-v1.test.mjs` bevatte regex-literals met verkeerd ontsnapte slashtekens en kon daardoor niet worden geladen. De inhoudelijke source-contractregex verwees bovendien naar een verouderde, engere terminatorcategorie. Het actuele uitvoerbare workflowcontract accepteert `supabase-(migration-history-(parity|canonical)|(current-)?production-ledger-parity)-` met hetzelfde beschermde productie-baselinepatroon.

## Begrensde reparatie

- Verwijder uitsluitend de historische losse Markdownregels uit het Heartbeat-testbestand; behoud de zeven bestaande autorisatie-, scheduler-, retry-, databaseverbinding- en durable-readbacktests.
- Vervang de twee misvormde migratiebron-regexen door exacte, parseerbare checks op de bestaande canonieke workflowbron. Behoud beide eerdere 568-record ledgerchecks, de drie testgevallen, de productie- en exact-HEAD-voorwaarden, en alle andere assertions ongewijzigd.
- Geen workflow, productiefunction, Supabase-DDL, bestaande scheduler, toegangsniveau, live connector, releasepoort of echte klantdata gewijzigd.

### Historische notities uit het ongeldige testbestand (niet nieuw geverifieerd)

- 2026-10-07 08:37:34 UTC: commercial-heartbeat:202610070837 actioned/VERIFIED en Edge HTTP 200 was destijds als durable receipt genoteerd.
- Productiemigratie 20261007083900 werd genoteerd als opschoning van de voormalige pg_cron heartbeat.
- De historische notitie vermeldde een migratietelling van 605 tot en met 20261007083900.

## Acceptatie en grens

Beide Node-tests moeten daadwerkelijk uitgevoerd worden op exact HEAD en het volledige bestaande BRAIN-backendtestpakket moet terminal slagen voor release. Het herstellen van twee laadfouten bewijst niet dat alle 355 geërfde fouten verdwenen zijn. Issue #3742 blijft beschermd: historische SQL mag niet als lege placeholders worden toegevoegd en remote/local parity vergt een ondersteunde Supabase-migratie-replay. Portal #4573 mag niet worden gemerged of uitgerold op basis van dit deelresultaat; voor #4215 blijven twee echte ingelogde tenantcontroles vereist.
