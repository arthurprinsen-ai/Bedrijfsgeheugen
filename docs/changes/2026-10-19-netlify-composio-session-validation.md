# Netlify reserve-deploy: Composio sessiecorrectie (19 oktober 2026)

## Live bewijs
- [OIDC-healthcheck #39217630002](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39217630002) authenticeerde de GitHub-workflow correct en bevestigde 2 pagina's en 54 bekeken Composio-accounts.
- Een actieve `netlify_mcp`-account werd aangetroffen; Composio verwierp vervolgens de expliciet gefilterde tool-router-sessie met provider HTTP 400 (in onze bridge gerapporteerd als HTTP 422).
- De originele bridge bewaarde geen veilige classificatie van de daadwerkelijke providerfout. De precieze oorzaak blijft een hypothese tot de nieuwe health-run of aanvullende providerlog.

## Correctie
Het gebruikers-ID, de enige toegestane toolkit `netlify_mcp` en het exacte aangesloten account blijven vastgelegd. De extra tool-slugallowlist bij het *aanmaken* van de sessie is verwijderd omdat Composio voor een MCP-toolkit op die laag validatieproblemen kan geven. De enige aan te roepen uitvoering blijft hardcoded als `NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER` met uitsluitend het bekende Netlify-project.

De foutrespons wordt uitsluitend als een beperkt diagnostisch type gelogd, zonder ruwe providerresponse, identifiers of tokeninformatie.

## Verplicht bewijs
Na Required CI/CodeQL, beschermde merge en Edge Function-release: een OIDC-only health-run zonder provider-build, gevolgd door echte transportactie en geverifieerde productiestatus als health groen wordt. Indien de nieuwe provider-400 terugkomt, gebruik de gesaneerde reden om gericht verder te herstellen en claim geen geslaagde deploy.
