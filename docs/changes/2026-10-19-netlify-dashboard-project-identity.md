# Netlify Platform account mismatch — veilige diagnose

## Brongegevens
Twee door eigenaar getoonde schermen uit Composio Platform project `arthur.prinsen_workspace_first_project`:
- Netlify_mcp Auth Config `Enabled` / `DCR OAuth`, één actieve verbinding en één verlopen historische account; actief onder `pg-test`.
- Users: `pg-test` 20 actief, `bedrijfsgeheugen-owner` geen actief, `bedrijfsgeheugen-owner-canonical` 10 actief en geen zichtbaar Netlify-icoon.

**Belangrijk:** de bestaande productiebridge accepteert ieder actief, compleet, ingeschakeld `netlify_mcp`-account op de API-sleutelprojectscope. De gebruikersnaam `pg-test` verklaart op zichzelf geen afwezige match.

Een bestaande OIDC-run en Supabase logs van 19-10 08:53–08:54 UTC doorzochten 54 accounts in 2 pagina's zonder actieve exact-match Netlify-account. Onduidelijk blijft of `COMPOSIO_API_KEY` naar hetzelfde Platform-project verwijst, of de accountpayload afwijkt qua toolkit/status/identiteit.

## Implementatie
De bestaande paginerende account-scan logt uitsluitend geaggregeerde aantallen van: exacte/naamachtige Netlify toolkit slug; actief/verlopen; actief maar uitgeschakeld; actief met onvolledige account-/gebruikersidentiteit; ontbrekende toolkitmetadata. De selectieregels, Supabase Vault sleutel, OIDC main-workflow guard, toegestane Netlify-toolslugs en fixed-site grenzen blijven onveranderd.

## Interpreteer live readback
- `slug_exact=0` en `slug_like=0`: ander project, verkeerde auth-scoping of ontbrekende records; controleer project-ID en Platform connection status (zonder tokens).
- `slug_exact=0` en `slug_like>0`: toolkitmetadata wijkt af; verifieer officiële identifier voordat een nieuwe match wordt toegelaten.
- `active_exact=0`, `expired_exact>0`: OAuth-accountstatus, wacht op bevoegde herauthenticatie in hetzelfde Platform-project.
- `active_exact>0`, `authorized_netlify_found=false`: analyseer `active_disabled` en `active_missing_identity`; geen rechten verruimen.
- `authorized_netlify_found=true`: ga pas dan door naar de bestaande OIDC-gezondheidscontrole met een echte Netlify provider-read; geen build bij health.

Een actieve account in de interactieve Composio-connector is niet automatisch de account in het Platform-project van de Supabase Vault-sleutel.

## Sluitcriteria
Protected Required CI + CodeQL, merge, Supabase source-byte readback, OIDC-health en een echte geautoriseerde fallback-Netlify-deploy met provider-ID, exacte SHA en publieke smoke-check. Laat P0 #4447 anders open. Geen nieuwe scheduler, providerconnector, aanmaak van testaccount of tokenrotatie.
