# Native Janitor incident-agent run-ID herstel — 2 november 2026
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320

## Wat faalde
Na de beschermde merge van #5323 is de originele Powerhouse Repository Janitor via GitHub `workflow_dispatch(mode=apply-safe)` gestart als run **41508842023** op main `896b4fc4db428c3aeaf13e6f9f02e083eefbee16`. De originele `Reconcile stale Actions and merged branch debris` en `Read back applied cleanup` slaagden; pas de nieuwe agentwaarnemer faalde met `JANITOR_AGENT_WRITEBACK_OR_SOURCE_FAILED:RUN_IDENTITY_INVALID`. De artifact-upload slaagde, maar het nieuwe incident-agent JSON-bestand kon vóór ID-validatie niet worden aangemaakt.

## Directe oorzaak en ontwerples
`tools/delivery/janitor-incident-agent.mjs` hergebruikte `numberOk` voor zowel PR-nummers als run-ID's. Die PR-regel beperkt IDs tot minder dan één miljard, terwijl de echte Actions-run elf cijfers heeft. Dat is een bewezen type-/namespacefout, anders dan de oorspronkelijke mogelijke HTTP422-aanroep. Gebruik afzonderlijke `runIdOk` met positieve safe-integer controle. `numberOk` blijft voor PR's onveranderd.

## Herstel en bewijs
Regressie `tests/brain-janitor-agent-self-recovery-20261102.test.mjs` accepteert exacte run 41508842023, controleert beide native aanroeppaden, wijst ongeldige IDs af, en behandelt een run-ID nooit als PR-opvolger. Dezelfde oorspronkelijke Janitor blijft eigenaar; geen tweede cron of ongecontroleerde side effects. Het canonieke ONE BRAIN-incident is eenmaal geregistreerd onder `github|janitor-agent|github-run-id-over-billion-rejected-by-pr-validator|20261102-v1`, oorspronkelijke run en owner, en blijft open tot nieuwe beschermde main-merge en een volgende native agent-run inclusief artifact/readback. Het brede portaal blijft gescheiden rood/oranje voor andere fouten.
