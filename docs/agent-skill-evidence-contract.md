# Per-agent skilluitvoering: bewijscontract (25 oktober 2026)

**Status: implementatievoorstel, NIET productiegroen.** De validator in `tools/brain/agent-skill-execution-evidence.mjs` is uitsluitend een fail-closed controlecontract. De aanwezigheid van deze code bewijst niet dat productie-agents al instrumentatie hebben of dat de skills feitelijk zijn toegepast.

## Aansluiten op de bestaande agent-executor (geen tweede scheduler)

1. Resolver leest per run de werkelijk verplichte skills uit de canonieke, versiegepinde skillmanifesten. Voor iedere skill geldt de SHA-256 van de **exacte geladen tekst**. Deze manifesthash moet afkomstig zijn van een trusted bron, nooit enkel uit de claim van de agent.
2. De bestaande skill-loader emit na een succesvolle leesactie een **trusted** loaderreceipt met runId, agentId, skillId, version, contentSha256, loaderId, loadedAt. De agent kan deze receipt niet zelf fabriceren. Bij loadfout: run = UNPROVEN; voorgeschreven herstelpad, geen stille fallback.
3. De bestaande executor koppelt per skill concrete assertions aan meetbare actie-/provider-/artifacts, waaronder readback van echte publicaties, orders of migraties waar van toepassing. Tekst als 'skill toegepast' is geen bewijs.
4. Een afzonderlijke trusted evaluator controleert de assertions en tekent een rungebonden evaluatieresultaat af. De agent mag zijn eigen run niet accorderen. Op dit moment controleert de validator de **structuur en consistentie** van aangeboden velden, niet hun herkomst/cryptografische authenticiteit; dit moet bij integratie door de trusted event- en artifactlaag worden afgedwongen.
5. Sla receipts, evaluatieresultaten en de gebruikte manifestversies append-only op in bestaande Brain-evidence-opslag; registreer event-ID, timestamp, run-ID, agent-ID, head SHA, tenant-scope, bewijsverwijzing en retention. Geen secrets, promptinhoud of persoonsgegevens in logs.
6. Koppel de bestaande Required/Heartbeat-rapportage aan `summarizeAgentCoverage`. Publiceer exact `checkedRuns`, `verifiedRuns` en afzonderlijke UNPROVEN-redenen; bij ontbrekende runs of observatie is de status UNPROVEN en nooit groen.
7. Een nieuwe skill, model, tool of innovatie heeft eerst security-/tenant-/kosten-/kwaliteitsevaluatie, eigenaar en gedocumenteerde toestemming nodig vóór activatie. Niet-goedgekeurd blijft uit.
8. Houd bestaande beveiligings-, CodeQL-, Required-, Supabase-preview-, provider- en beschermde mergecontroles volledig intact.

## Acceptatie

- Alle actieve agenttypes produceren bij iedere echte uitvoering loaderreceipts én onafhankelijk beoordeelde application-assertions; ontbrekende uitvoeringen/agents worden met een aparte inventory-versus-runs-reconciliatie opgespoord.
- Positieve en negatieve tests slagen, met onder meer load failure, verkeerde skillhash, run-mismatch, ontbrekende application assertion, self-verification en niet-goedgekeurde innovatie.
- Echte staging-uitvoeringen leveren bewijs uit de bestaande trusted executor en providerreadbacks; cross-run/tenant-spoofingtests slagen.
- Required-controles slagen op de exacte PR-head; pas na protected merge en productie-readback kan de bewijsketen live worden genoemd.

## Belangrijke beperking

`VERIFIED_EVIDENCE` uit de zuivere validator betekent alleen dat het **aangeboden bewijsrecord** aan het contract voldoet. Voor onafhankelijke end-to-end assurance moeten receipts onforgeable zijn, evaluatorautorisatie en provenance expliciet worden gevalideerd, en agent-run-inventory compleet zijn. Laat de overall-status rood/onbewezen totdat dit in de productie-executor is verbonden en getoetst.
