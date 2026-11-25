# 2026-10-23: bewijsvaste CI-werkverdeling over bestaande agents

- Canonieke eigenaar: #4661. Volgorde: PR #4731 cross-lane impact; #4732 ruwe meting; #4734 adaptief; #4738 provider fail-fast; #4739 alleen werkelijk uitgevoerde jobs en top-5 hotspots.
- Productiebron: Janitor #39926363163 op exact main SHA 8a08a22107b29adc4a4fdcd92eb228e5a04790e6. 28 geldige jobs, 13 runs, p95 queue 3 sec, langzaamste uitgevoerde job 353 sec; geen providerleesfouten. Geen vergelijkbaar before/after snelheidseffect bewezen.
- Oorzaak verbeterverplichting: ruwe meetdata zonder expliciet unieke eigenaar en failclosed intent kan tot dubbel werk, ongefundeerde optimistische prioritering, nieuw CI-fanout of concurrente writers leiden.
- Implementatie: nieuw pure contract `tools/delivery/ci-agent-priority.mjs`, hergebruikt door `tools/delivery/ci-throughput-telemetry.mjs` als veld `agent_priority_advice` binnen **hetzelfde** uurlijkse bewijsartefact. Geen enkele nieuwe workflow, scheduler, GitHub API-GET, branch-owner, issue of productiejob.
- Preventie: verifieer volledige GitHub-readbacks, authenticiteit van run/attempt/job/SHA, minimaal 20 uitgevoerde jobs en 5 runs, maximaal 3 verschillende owners, overige acties als readonly onderzoek. Onbekende eigenaars expliciet unresolved. Geen CI-gatebypass, geen betaalde capaciteit, geen release claim.
- Regressie: `tests/brain-ci-agent-prioritization-v1.test.mjs` test betrouwbare sample, source-dedupe, providerfailure, niet-uitgevoerde jobs, owner ambiguïteit en ingekoppelde collector.
- Vrijgave nog te bewijzen via Required+CodeQL op immutable head, protected auto-merge, productie main+Janitor readback en bestaande Brain skillprojectie. #4661 niet sluiten op advisory evidence alleen.
