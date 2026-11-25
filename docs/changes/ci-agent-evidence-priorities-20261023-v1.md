# CI-meetbewijs omzetten in gecoördineerde agentprioriteiten

Eigenaar: [issue #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). De bestaande uurlijkse Repository Janitor blijft de **enige** CI-observatiescheduler. Hij leest echte afgeronde GitHub-jobs via de bestaande `ci-throughput-telemetry.mjs`, met het uitgevoerde-jobs-filter uit PR #4739.

## Productiegrondslag
De echte [Janitor-run #39926363163](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39926363163) leverde 28 geldige jobs uit 13 workflowpogingen, zonder providerleesfout; p95 wachten 3 sec. De langzaamste daadwerkelijk uitgevoerde job duurde 353 sec. Dit is **geen** statistisch bewezen CI-snelheidswinst of workflowkritiek pad. Onafhankelijke [Required-run #39925844365](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39925844365) had een 75 sec preflight, met circa 47,47 sec voor de volledige static i18n-build-cachecontrole (132 bestanden / 9101 strings). Dat maakt exacte, herhaalbare buildfaseprofilering een kandidaat voor onderzoek, niet een reden voor gate-omzeiling.

## Gedrag
`routeObservedCiHotspots` neemt **alleen** complete `SAMPLED_METRICS_NOT_SLO`-telemetrie van bestaande providerjobs. Iedere aanbeveling bewaart run, attempt, job ID, SHA en gemeten duur en wordt conservatief op jobnaam aan website, backend/Supabase, Portal, ONE BRAIN, Heartbeat of Powerhouse gekoppeld. Als de eigenaar niet onderbouwd is, krijgt de lane `owner-unresolved`. Maximaal drie **verschillende** owners ontvangen prioriteit, nooit meerdere schrijvers voor één gemeten lane. Onvolledige providerreads, <20 jobs/<5 runs, skipped records, ongeldig bewijs en identiteitsdubbelingen houden alle voorstellen tegen.

De adviezen blijven `EVIDENCE_BACKED_INVESTIGATION_ONLY`: `may_mutate=false`, `may_dispatch=false`, `may_promote=false`. Alleen de bestaande canonical writer/lease kiest vervolgens een veilig experiment met koude/warme exact-SHA-comparatie en uitvoer-/securitypariteit; de hele protected CI en verplichte providerreadbacks blijven intact. Er is geen nieuwe scheduler, runfanout, geheugen, betaalde capaciteit of productieclaim.

## Verificatie
`node --test tests/brain-ci-agent-prioritization-v1.test.mjs`; canonieke Brain historical replay/shadow/canary; exacte Required, CodeQL, beschermd merge, daarna werkelijk Janitor-artefact `powerhouse-ci-throughput.json` met `agent_priority_advice`. Meet echte verbetering pas met meerdere vergelijkbare samples en behoud issue #4661 OPEN tot dat resultaat bewezen is.

Officiële GitHub-cachebeveiliging: https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching
