# Main Write Integrity: provider JSON-vorm controleren vóór incidentmutatie

Datum: 2026-10-23  
Bestaande foutautoriteit: [#3191](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3191), [historische terminale correctie #4657](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4657).  
Fingerprint: `delivery|main-write|unverifiable-pr-association-v1`.

## Onafhankelijk bewezen incident
De bestaande `Main Write Integrity`-workflow rapporteerde op [run #39940563356](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39940563356) `PROVIDER_PR_PROOF_UNVERIFIED` na vijf beperkte GitHub-probes. De classificatie bleef terecht `UNKNOWN_MAIN_WRITE`. Dezelfde run faalde bij issue-upsert met `jq: Cannot index string with string "pull_request"`. Een afzonderlijke latere providerlezing van exact `03bf825a6f4207df397f045ba0a3630faef34170` bevestigt wél de protected squash-merge van [PR #4762](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4762). Tijdelijke ontbrekende associatie is dus geen bewijs van ongeautoriseerde directe push.

## Gerichte bestaande-codecorrectie
De bestaande incident-upsert vraagt de volledige issues-listing op vóór mutatie, controleert dat elke responsepagina een array met issue-objecten is, en beëindigt de stap met een expliciete fout als de provider een error-object of een ander formaat teruggeeft. Alleen na die validatie matcht hij de bestaande fingerprint in een daadwerkelijke tekst-body. Dat voorkomt parsercrashes en vermijdt nieuwe dubbele incidenten bij onbekende providerstatus. Er wordt **geen** direct/main write als groen geclassificeerd zonder exact gemergde-PR-providerbevestiging.

## Acceptatie
- `node --test tests/brain-main-write-integrity.test.mjs`
- Exact-head hygiene / Required / CodeQL; protected merge.
- Volgende natuurlijke `Main Write Integrity`-run readback op daadwerkelijke GitHub-providerresponses.
- Geen nieuwe cron, backend, database, foutgeheugen, agent, OAuth-grant, kosten of direct production write.
- Bronwijziging is CI-governance-only; Netlify-websiteherdeploy alleen bij aangetoonde runtime-impact.
- Huidige status: **candidate, nog geen productieherstelbewijs**.
