# Production Source Snapshot: push-promotie herstellen

## Probleem
De canonieke `Production Source Snapshot` workflow werd bij een wijziging van het workflowbestand op `main` wel gestart, maar voerde de productie-deploy niet uit. De workflow maakte alleen het bronpakket.

## Root cause
De workflow had een `push`-trigger, terwijl zowel **Deploy exact source through authorized Netlify transport** als **Prove exact production identity** uitsluitend draaiden bij `workflow_dispatch` met `deploy=true`. Daardoor kon een recovery-merge terecht zeggen dat de canonieke transportbaan werd gestart, terwijl de provider-side-effect feitelijk werd overgeslagen.

## Oplossing
Beide stappen draaien nu bij:
- een protected push naar `main` die deze workflow wijzigt; of
- een expliciete `workflow_dispatch` met `deploy=true`.

De bestaande Netlify MCP-proxysecret, exact-source packaging en bounded `release.json` SHA-proof blijven ongewijzigd.

## Preventie
`tests/brain-production-source-push-promotion-v1.test.mjs` blokkeert een regressie waarbij de push-trigger en de deploy/proof-voorwaarden opnieuw uit elkaar lopen.
