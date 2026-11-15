# Originele BRAIN-postmergecontrole: vier historische testverwachtingen worden brongetrouw hersteld

Datum: 15 november 2026. Canonieke incident-eigenaar: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Oorspronkelijke correctie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5821.

## Echt gemeten falen en hoofdreden

De bestaande veilige terminalworkflow `Obligation Terminal Closure PR #5821` (run `43695356905`) heeft het oorspronkelijke `BRAIN delivery PR #5821 173b53fd0e84b27a078cad39dcbbe8f2fae413df` gevonden (`43695381458`). Die originele BRAIN-uitvoering faalde in zijn backend-verificatiejob `132754808017`: **6.786 tests, 6.780 geslaagd, 4 gefaald, 2 overgeslagen**. De terminal weigert daarom terecht sluiting met `TERMINAL_CRITICAL_GATE_FAILED:BRAIN`. De volledige foutcluster is opgeslagen als originele run-artifact `14154123742`.

Alle vier fouten komen aantoonbaar uit oude regressietestcontracten die de historische, onvolledige `runs?branch=main&event=workflow_dispatch&per_page=100`-bron eisten of uitsluitend die oude GitHub-API mockten. Dat kan nooit de nieuw beveiligde `created=${created_filter}` + `--paginate --slurp` + volledige bronindex bewijzen. Het is géén reden om oorspronkelijke terminal-, Required-, CodeQL-, netwerk-, toegangs- of agentcontroles te omzeilen.

## Reparatie bij dezelfde eigenaar en incidentlineage

De eerste drie tests eisen nu de reeds geïmplementeerde PR-creatietijdgrens, native volledige pagination, exacte titel en head via dezelfde `brain-verification-flight-index.mjs`, en fail-closed bij ontbrekend of corrupt bewijs; zij verbieden de oude first-page-only query voor de originele terminal. De vierde shell-test simuleert de originele `gh api --paginate --slurp` met echte volledig gestructureerde `total_count` + `workflow_runs` plus de bestaande historische terminalizer-opvraag. Zowel correct succes als geen record, verkeerde head, verkeerde branch, FAILED, SKIPPED en IN_PROGRESS blijven gecontroleerd.

De concrete wijzigingen zijn vier bestaande regressietests, de originele `powerhouse-post-merge-codeql`-skill, een `OBSERVED` ONE BRAIN learning record en dit append-only menselijke bewijs. Geen nieuwe scheduler, agent, queue, SQL-migratie, email of claim van werkelijke innovatie.

## Werk telt uitsluitend met eindbewijs

Een protected kandidaat met lokale assertions telt nog niet als productie: exact-head Required, CodeQL en volledige originele BRAIN, protected GitHub-merge, onafhankelijke originele terminale readback en relevante productiestatus. De 14 `INNOVATION_INTAKE/PLANNED`, 14 open leveringsverplichtingen en 0 onafhankelijke agent-ACK blijven vervolgens als apart operationeel werk OPEN. Echte `agent-integration-engineer` en `agent-growth-market` moeten hun opdrachten consumeren met echte `remote_ref`, bronrevisie, owner en na productie het gemeten effect; geen statuscode of testreparatie kan deze consument vervangen.
