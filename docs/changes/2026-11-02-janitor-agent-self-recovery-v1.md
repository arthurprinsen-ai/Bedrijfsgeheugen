# Canonieke Janitor-agent: automatisch signaleren, veilig verifiëren en leren

Datum: 2 november 2026. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320
Nieuwe preventiecontrole: `github|janitor-agent|self-observation-positive-successor-proof|20261102-v1`.
Oorspronkelijke fout: GitHub Actions-run 41342975119, job 124956777904, HTTP422 plus daaropvolgende jq Broken pipe. De andere twee jobs en de artifact-upload waren geslaagd; dat betekende **niet** dat de cleanup geslaagd was. De exacte HTTP422-API-aanroep is historisch niet bewezen.

## Agentroute zonder parallel systeem
De originele `Powerhouse Repository Janitor` behoudt zijn enige bestaande `17 * * * *` schedule, Github-token, drie jobs en beschermde main. De agent `tools/delivery/janitor-incident-agent.mjs` heeft twee veilige functies:
1. **Bronherstel:** wanneer gesloten terminal-lease-PR ontbreekt uit de beperkte gesloten-PR-snapshot, doorzoekt dezelfde Janitor de officiële GitHub-PR-index en verifieert een positieve hit via een afzonderlijke directe PR-readback. Hij vereist exacte Obligation-ID en Supersedes plus merged/closed. #2225 → #2353 is bewezen positief. Geen hit, incomplete zoekindex, API-fout of ontbrekende branch is nooit bewijs om een PR te openen of te verwijderen.
2. **Incidentbewaking:** ook als de cleanup faalt, voert dezelfde bestaande workflow een `if: always()`-waarnemer uit. Deze schrijft `.artifacts/janitor-agent-incident.json` met oorspronkelijke run/attempt/SHA, outcomes, eigenaar, type en volgende veilige actie; een mislukte cleanup veroorzaakt een gededupliceerde broncomment in het bestaande incident #5320. De GitHub-comments worden onafhankelijk teruggelezen; ontbrekend registrybewijs blijft rood.

De eerste bronpatch PR #5321 is al beschermd gemerged op `88b53ef8d5d0257bfadc09fe6141bba6e3198708` met Required/CodeQL. Die codeclaim is **niet** hetzelfde als de native Janitor-runtime-readback voor deze uitgebreide agentpatch. Status blijft `CANDIDATE` tot de nieuwe PR beschermd gemerged is en de bestaande Janitor de nieuwe branch-protectie en run-level readback werkelijk bewijst.

## Kwaliteitsborging
Regressies: `tests/brain-janitor-agent-self-recovery-20261102.test.mjs` plus `tests/brain-janitor-terminal-lease-422-20261101.test.mjs`. Assert rechtstreeks: #2353 positief, ontbrekende ongeldige/onvolledige zoekresultaten falen veilig, geen blind open-PATCH, originele 17e-minuut cron, en een gefaalde cleanup is incident, ongeacht een later succesvolle artifact-upload. Leerbewijs in `brain/learning/2026-11-02-janitor-agent-self-recovery-v1.json`, agentbeleid in de twee bestaande skills en deze menselijke registratie. Nooit beveiligingschecks uitschakelen, eigen bronbewijs fabriceren of systeem/portaal alles groen zetten wanneer de 133 historische driftwaarnemingen nog niet als opgelost zijn bewezen.
