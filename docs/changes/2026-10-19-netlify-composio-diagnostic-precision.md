# Netlify-reserveverbinding — precieze, veilige providerdiagnostiek

## Vastgesteld
Supabase Edge Function v165 (beschermde GitHub-`main`) vond de actieve `netlify_mcp`-verbinding tijdens een OIDC-geautoriseerde source-snapshot, met 2 pagina's en 54 accounts. Toch wees `POST /api/v3.1/tool_router/session` het verzoek af met provider HTTP 400. De bestaande classificatie `TOOL_ALLOWLIST_INVALID` is onbetrouwbaar omdat het verzoek geen `tools`-allowlist meer bevatte; de brede regex kon `toolkits` verwarren met `tools`.

## Correctie
Classificeer expliciete foutvelden via een vaste allowlist en afzonderlijke signalen voor `toolkits`, `tools`, `connected_accounts`, `user_id`, `auth_configs`. Log uitsluitend booleans, enumeraties, JSON-responsformaat en HTTP-status. Onbekende categorie blijft `SESSION_REQUEST_INVALID`. Geen ruwe providertekst, identiteit, account-ID, Composio-projectsleutel, OIDC-token of Netlify-proxy.

## Acceptatie
De bestaande Production Source Snapshot en Edge Function zijn de enige release-eigenaren. Verplichte GitHub Required CI + CodeQL, beschermde merge en exacte Supabase-codeversie-readback. Vervolgens een bestaande OIDC-authority-run; pas daarna veldgerichte reparatie op basis van werkelijke logs. Provider-deploy-ID, productie-SHA en functionele readback blijven noodzakelijk om P0 #4447 te sluiten. Geen beveiligingsomzeiling.
