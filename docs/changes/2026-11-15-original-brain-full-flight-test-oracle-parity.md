# Originele BRAIN-postmergecontrole: vier historische tests verwachtten een verwijderde zoekactie

**Datum:** 15 november 2026. **P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. **Oorspronkelijke terminalreparatie:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5821.

## Exacte bronwaarneming

PR #5821 werd via de originele GitHub Required- en CodeQL-poorten beschermd gemerged naar `ded9ff6a1ace0c39f2520b978bce666342b9c487`. De originele postmerge terminal run `43695356905` vroeg de echte originele, read-only `unified-brain-delivery.yml`-verificatie aan. Exacte BRAIN-run `43695381458` faalde echter in backend job `132754808017`: **6.780 tests geslaagd, vier gefaald, twee overgeslagen**. De terminal weigerde correct: `TERMINAL_CRITICAL_GATE_FAILED:BRAIN:run=43695381458:conclusion=failure`. De eerdere beschermde merge is dus geen terminal groen.

Alle vier failures zijn historisch stale test assertions: de originele terminale finale poort had vroeger letterlijk `runs?branch=main&event=workflow_dispatch&per_page=100`, zonder volledige GitHub-providerpaginatie. Die implementatie was bewust vervangen door een bronbegrensde `created=${created_filter}&per_page=100` met `gh api --paginate --slurp` en `brain-verification-flight-index.mjs`. De oude tests onderscheidden daardoor correcte nieuwe gate-logica niet van een fout. De uitgevoerde bronfix is de enige huidige gate-eigenaar, geen nieuwe executor.

## Gerichte wijziging

In de vier bestaande testbestanden wordt geen afgeschafte query meer voorgeschreven. De test vereist nu de echte afsluitpoort: volledige native providerpagina's, PR-created-at-bovengrens, exacte PR/head-run, `completed/success`, originele beschermde main-afstamming en fout bij ontbrekende, gedeeltelijke, verkeerd getitelde, niet-afgeronde, mislukte, overgeslagen of vervalste run.

Het bestaande uitvoerbare Bash-fixture voor `obligation-terminal-closure.yml` voert nu de **echte** indexcode en native-achtig gepagineerde respons uit; het oudere aparte `powerhouse-obligation-terminalizer.yml`-fixture blijft origineel behouden. De veiligheid wordt niet verlaagd. Extra bewijs: dezelfde bestaande post-merge skill, machine-leerrecord en append-only ontwikkellog.

## Benodigde succescontrole

Exact-head Required en CodeQL, originele BRAIN op de nieuwe broncommit, protected merge, originele postmerge terminal en onafhankelijke productie-/hoofdstamreadback. De historische mislukte PR #5821-BRAIN-run blijft echte historische fout en mag niet met een latere PR achteraf als geslaagd worden aangemerkt. De volledige innovatielus blijft open: **14 oorspronkelijke INNOVATION_INTAKE PLANNED, 14 INNOVATION_DELIVERY OPEN, 0 onafhankelijke uitvoerende agent-ACK's**. Geen nieuwe scheduler, queue, netwerkpublishing, providergoedkeuring, achterdeur of kunstmatige klantwaarde.
