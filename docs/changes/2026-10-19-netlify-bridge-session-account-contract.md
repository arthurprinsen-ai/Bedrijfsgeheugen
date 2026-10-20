# Productieherstel — Netlify/Composio single-account session

## Bestaande toestand
Powerhouse gebruikt één beschermde releaseketen: GitHub `main` → OIDC-verificatie → Supabase `netlify-deploy-bridge` → Composio Netlify → provider-deploy met onafhankelijke readback. De screenshot van 19 oktober en Supabase logs bewijzen dat er een actieve Netlify MCP-verbinding is, maar *niet* dat er al gepubliceerd is. Op de laatste providercontrole liep Netlify achter op GitHub.

## Gedocumenteerde contractfout
Na account-herstel staat de Netlify-tool in de Composio-sessie op exposed=true maar `session.execute` retourneert 400. In een vastgepinde sessie met precies één account is een extra multi-account selectie redundant. De officiële API-spec specificeert die selectie voor multi-account workflows: https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSessionBySessionIdExecute .

## Kleinst mogelijke wijziging
Alleen de extra `account: context.accountId` uit de tool-execute-body verwijderen. De bestaande `connected_accounts: { netlify_mcp: [context.accountId] }`-binding, OIDC-broncontrole, positieve toolallowlist, provider-site-match, reads-first en veilige foutafhandeling blijven ongewijzigd. Bewaak dit in `tests/brain-netlify-single-account-execution-v1.test.mjs`.

## Grenzen
Deze wijziging kan de HTTP400-oorzaak verhelpen, maar geldt pas als opgelost na runtime-readback. De actuele Supabase Production Authority test is tevens geblokkeerd door een ongeldige `SUPABASE_ACCESS_TOKEN` in GitHub Actions; die secret mag niet worden vervangen met veronderstelde waarde of browserlogin. Volledige acceptatie vereist een geldige goedgekeurde Edge releaseweg, 200 provider-health, gevalideerde Netlify SHA, en productiebrowsertest. Geen omweg langs branch protection of tenantgovernance.
