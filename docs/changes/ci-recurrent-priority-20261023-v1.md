# Meervoudig bewezen CI-knelpunten vóór losse pieken

Canoniek eigenaar: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Bestaande basis: `tools/delivery/ci-agent-priority.mjs`, `predictive-controller.mjs` en de **bestaande uurlijkse** Repository Janitor. Geen nieuwe planner, agent, scheduler, queue of incidentgeheugen.

## Feitelijk probleem
Het bestaande systeem rapporteert al `recurrent_hotspots` voor exact dezelfde workflow-ID en jobnaam uit minstens **drie onafhankelijke workflowpogingen**. De adviesrouter koos echter de hoogste **losse** uitvoertijd uit de top vijf, waardoor een incidenteel traag job een terugkerende bottleneck kan verdringen. Echte recente Janitor-metingen: 28 uitvoeringen uit 13 workflows, p95-startwachttijd 3 seconden, één job van 353 seconden. Dat is één steekproef en **geen** bewezen tijdwinst.

## Nieuw, begrensd gedrag
- Gebruik alleen bestaande `job_evidence` met de originele run-ID, attempt, job-ID, commit SHA, workflow-ID, jobnaam en uitgevoerde timing.
- Verifieer terugkerende signalen volledig: dezelfde numerieke workflow-ID plus identieke jobnaam, iedere matrix-run maximaal eenmaal per attempt, minstens drie pogingen, exacte herberekening van mediaan/p50, maximum, aantallen en runidentiteiten.
- Sorteer bewezen terugkerende problemen op **herhaalde steekproefmediaan** vóór een enkele piek; vul uitsluitend andere owner-lanes met resterende single-window hot spots aan.
- Eén prioriteit per eigenaar, standaard maximaal drie. Behoud `owner-unresolved` voor onbekende jobs; meld `WITHHELD_UNVERIFIED_RECURRENT_PROOF` bij tegenstrijdige herhaalbewijzen.
- Output blijft `EVIDENCE_BACKED_INVESTIGATION_ONLY` met `may_mutate=false`, `may_dispatch=false` en `may_promote=false`. Alle tests, beveiliging en externe providerreadbacks blijven ongewijzigd.

## Toets en vrijgave
`node --test tests/brain-ci-agent-prioritization-v1.test.mjs` omvat herhalingsprioriteit versus een grotere losse piek, malformed/verdubbelde bewijsrijen en agent-autoriteit. Canonieke Brain historical replay/shadow/canary, Required, CodeQL en GitHub branch-protection moeten slagen voordat één beveiligde merge mogelijk is. Werkelijke CI-snelheidswinst vereist later herhaalde vergelijkbare, exacte-SHA-metingen (geen onbewezen groen). Officiële GitHub-cache-security: https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching.
