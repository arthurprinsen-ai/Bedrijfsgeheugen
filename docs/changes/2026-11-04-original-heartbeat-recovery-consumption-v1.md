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
