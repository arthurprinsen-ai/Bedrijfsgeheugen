# Netlify reserve-deploy — Composio v3.1 session execution proof

## Live bewijs
Geauthenticeerde GitHub OIDC health-only run [#39228785972](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39228785972) heeft in Supabase v172 één actieve, complete en ingeschakelde `netlify_mcp`-account gevonden uit 50 accountrecords. De sessie-aanmaak werkte vervolgens, maar een uitsluitend lezende `get-project`-toolaanroep kreeg provider HTTP400. Geen Netlify-build gestart.

## Bevestigde tweede implementatiefout
De Composio v3.1 session execute API retourneert `{result_type, data, error, log_id}` en niet het legacy/direct-tools veld `successful`. De oude code vereiste `parsed.successful === true` en zou daardoor ook geslaagde v3.1-toolresponses valselijk afwijzen.

## Herstel
- Alleen `result_type=completed`, HTTP2xx, daadwerkelijk `data`, geen providererror en geen nested `successful:false` accepteren.
- Bij elke echte afwijzing: uitsluitend HTTP, toolsoort (read/deploy), een vaste geclassificeerde foutcategorie, het resultaat-type en een regex-gevalideerde Composio `log_id` rapporteren, zonder vrije providertekst, identifiers of credentials.
- Bestaande GitHub OIDC project/ref/workflowcontrole, Supabase Vault project-sleutel, Composio account-/userbinding, harde Netlify site-ID, alleen-lezen health en fixed deploytool blijven strikt.

## Acceptatie
Required CI, CodeQL, beschermd squash-merge, exacte Supabase source-readback. Vervolgens één bestaande OIDC-only Netlify-gezondheidscontrole. Als de provider 400 blijft weigeren, uitsluitend de veilige `error_kind` en `log_id` opvolgen; geen blinde herautorisatie of sleutelrotatie. Sluit P0 #4447 pas bij geverifieerde Netlify provider-deploy-ID, juiste source SHA en publieke smoke/readback.

Official API: https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSessionBySessionIdExecute
