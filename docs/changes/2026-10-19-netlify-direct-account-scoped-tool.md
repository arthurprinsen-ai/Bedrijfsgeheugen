# Netlify backup — Composio direct tool recovery

## Providerbewijs
OIDC-read-only run [39221115055](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39221115055): OIDC verified; 2 account pages / 54 accounts; actieve `netlify_mcp`-account gevonden; v3.1 Tool Router session HTTP 400 `TOOLKIT_CONSTRAINT`. Dit bewijst een onwerkbare sessieconfiguratieklasse, niet ontbrekende toegang tot de gekoppelde account.

## Herstel via de officiële API
Gebruik `POST /api/v3.1/tools/execute/{tool_slug}` met de al geautoriseerde Supabase Vault-projectsleutel en expliciete `connected_account_id` + `user_id`. OIDC-repository, main-ref, bronworkflow en Netlify-site-id blijven onveranderd. Alle toolslugs en inputs zijn hardcoded; geen gebruiker kan via deze bridge een willekeurige Composio-tool aanroepen.

- `action=health` voert uitsluitend `NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER` met `get-project` uit en controleert de vaste Netlify-site-id. Geen `deploy-site` en geen build.
- Alleen de bestaande productieherstelstap gebruikt `NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER` om een kortlevende proxy voor de source-gepinde Netlify-deploy te verkrijgen.
- Fouten worden samengevat in HTTP-code en booleaanse categorieën, zonder credentials, providerantwoorden, account-ID's of proxy-links in logs.

## Verificatie en bevoegdheden
Protected GitHub Required CI/CodeQL, squash-merge, readback van het exact gedeployde Supabase-functiebestand, geautoriseerde OIDC-read-only provider-health, vervolgens een echte runtime-fallback Netlify-provideractie, deploy-ID, productie-source-readback en functionele smoke-test.

Een groene healthcheck bewijst **niet** dat de fallback als echte deploy geslaagd is. Incident [#4447](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447) blijft OPEN totdat ook die provider-effectbewijzen aanwezig zijn. Geen versoepeling van OIDC, branchebeveiliging, tenantisolatie of toegangsrechten.

Officiële bron: https://docs.composio.dev/reference/api-reference/tools/postToolsExecuteByToolSlug
