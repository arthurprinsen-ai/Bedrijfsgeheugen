# Bestaande Heartbeat gebruikt werkelijk herstelbewijs

**Datum:** 4 november 2026. **Eigenaar:** oorspronkelijke ONE BRAIN / Heartbeat runtime-mux-eigenaar. **Centraal incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Situatie en gemeten oorzaak
Productie bevat sinds PR #5381 een beveiligde herstelbewijsfunctie. Zij telt 307 afgesloten controles en 306 expliciet nog onopgeloste historische uitkomsten. Maar de oorspronkelijke periodieke herstelcontroller heeft geen actieve directe cronjob. De bestaande scheduler #171 voert wel iedere vijf minuten de originele terminale reconciler uit; de bijgehouden taakuitkomst vermeldde tot nu toe alleen `ok=true` en de verstreken tijd. Daardoor kon een succesvolle interne uitvoering worden aangezien voor bewezen extern herstel.

## De wijziging
Behoud scheduler #171, de bestaande `powerhouse_runtime_mux_task_v1`, de bestaande reconciler, dezelfde auteursrechten en dezelfde ONE BRAIN-foutafhandeling. Alleen voor de bestaande `terminal-autonomous-reconcile`-taak wordt het originele JSONB-antwoord teruggelezen en het contract gecontroleerd. Daarna leest dezelfde transactie uitsluitend de beperkte bronweergave `powerhouse_recovery_review_truth_v1()`. Het geaggregeerde bewijs wordt toegevoegd aan de reeds bestaande `task_results`; het bevat geen persoonsgegevens of ruwe fouten.

Een volledig uitgevoerde interne ronde kan terecht `ok=true` zijn en tegelijkertijd `recovery_provider_resolution_proven=false` en `EVIDENCE_DUE` laten zien. Een ontbrekend broncontract moet `ok=false` opleveren. Alle andere taken blijven gelijk. Er wordt geen tweede cron, agent, queue of provideractie gemaakt. Geen historische replay zonder idempotentie of onafhankelijk bewijs.

## Autonome gesloten lus
Bronwaarneming → unieke fingerprint en huidige oorspronkelijke eigenaar → oorzaak/hypothese → veilige omkeerbare test of experiment met baseline en guardrails → exclusieve schrijfrechten → protected PR en checks → echte productiedeploy → natuurlijke Heartbeat-uitvoering → zelfstandig externe providerreadback → klant-/omzet-KPI → Brain-evaluatie en preventieregel → CAS-afsluiting met controles. Onzekerheid blijft zichtbaar, ook in het portaal. OAuth, betaalgegevens en extra kosten blijven expliciete menselijke handelingen.

## Vrijgavecriteria
Exacte Required/BRAIN/CodeQL/Supabase-preview voor de commit, oorspronkelijke lease, beschermde merge, toepaste productiemigratie, afgeschermde uitvoerrechten en twee natuurlijke #171-runs met nieuwe `recovery_review_truth` nodig voordat de aansluiting live bewezen is. De 306 historische uitkomsten blijven open tot hun individuele bewijs.

## Migratiehistorie en actuele releasegrens
Supabase-preview had de oorspronkelijke migratieversies `20261104064400` en `20261104065001` reeds verwerkt voordat de striktere terminale broncontractcontrole werd ontworpen. Beide oorspronkelijke SQL-bronnen zijn onveranderd hersteld in Git. De definitieve aanscherping staat uitsluitend in een latere, nieuwe migratie `20261104071100_original_heartbeat_terminal_contract_guard_v1.sql`. Alleen een native preview die de nieuwste versie werkelijk heeft uitgevoerd en de nieuwe functie terugleest, telt als groen. Een oude preview met de velden maar zonder het contract is geen onafhankelijke test. Geen providerhistorie direct manipuleren, geen tweede scheduler aanmaken.
