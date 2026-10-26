# Netlify reserveverbinding — juiste OAuth-account kiezen met bewijs

## Waarom deze wijziging nodig is
De eigenaar heeft via de bestaande `netlify_mcp` DCR OAuth-authconfig een aanvullende Netlify-verbinding gemaakt. De Composio Platform-interface toont nu twee ACTIVE accounts. De eerder vastgestelde upstream fout op het oude account was `StreamableHTTP (HTTP 401 Unauthorized), simple HTTP (McpError: Connection closed)`. De Canonieke OIDC health-only run [#39234783733](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39234783733) vond 2 ACTIVE accounts onder 50 records, maar de read-only Netlify-tool faalde opnieuw met session execute HTTP400.

De oorspronkelijke bridge nam `items.find(ACTIVE)`: de eerste account, zonder daadwerkelijke provider-validatie. De volgorde van gekoppelde accounts is geen bewijs van geldige Netlify OAuth-toestemming.

## Exacte correctie
- Lees met dezelfde beveiligde Vault-projectsleutel en dezelfde vaste `netlify_mcp` toolkit alle ACTIVE, niet uitgeschakelde, complete accounts over cursorpagina's. Weiger meer dan vier kandidaten om onbegrensde providerverzoeken te voorkomen.
- Geef recent verbonden accounts voorrang **zonder** dat als autorisatiebewijs te gebruiken.
- Voer per kandidaat de uitsluitend lezende `get-project` uit via de bestaande strikt OIDC-geauthenticeerde Supabase-bridge. Een geschikte kandidaat moet als resultaat het exacte Netlify-site-ID teruggeven. Gebruikers- en account-ID blijven uit logs.
- Kies uitsluitend deze daadwerkelijk geverifieerde kandidaat voor de `deploy-site`-proxyauthoriteit van het bestaande protected Github-source-publicatiepad. Bij twee weigeringen of verkeerde site: fout `composio_netlify_provider_authority_unverified`, HTTP424, **nooit** een build starten.
- Een health-only aanvraag doet geen deploy, zelfs wanneer de provider-read slaagt.

## Bewijs en veiligheid
De eerdere fout `StreamableHTTP HTTP401` is aangetoond voor de Platform Netlify reader, niet voor alle Netlify-accounts. Deze wijziging moet in productie opnieuw bewijzen welke verbinding werkt; een Groene CI, ACTIVE-status of upstream Git-native deploy is onvoldoende.

Acceptatie vereist Required CI, CodeQL, protected merge, exacte Supabase-versie/bestand-readback, een OIDC-only health-run met `NETLIFY_BACKUP_PROVIDER_READ_VERIFIED`, vervolgens één rechtmatig gestart echt Netlify backup-deploy met provider-ID, exacte source SHA en functionele productie-readback. Bestaande incident [#4447](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447) blijft anders open. Geen nieuwe scheduler, scope-uitbreiding, OAuth-token uitlezing of API-sleutelrotatie.
