# Authenticated Portal production canary v1

## Probleem

De Portal-code, Netlify Function en onderliggende productiegegevens waren aantoonbaar correct, maar de releaseketen kon nog geen echte ingelogde eindgebruikerssessie reproduceren. Daardoor bleef één bewijsstap handmatig: een authenticated HTTP 200 op `/api/portal-ondernemersdata`.

## Structurele oplossing

De bestaande `Production Release Readback` gebruikt voortaan GitHub Actions OIDC. Alleen een kortlevend, cryptografisch geverifieerd token uit `arthurprinsen-ai/Bedrijfsgeheugen`, op `refs/heads/main`, uit exact `.github/workflows/production-release-readback.yml` en met de canary-audience wordt geaccepteerd.

De Netlify Function `portal-auth-canary-session.mjs` maakt daarna tijdelijk een auto-confirmed Netlify Identity-gebruiker aan met een synthetische tenant, voert de normale server-side Identity-login uit en laat de workflow de verkregen sessiecookie gebruiken voor de **ongewijzigde** `/api/portal-ondernemersdata` route. De readback moet HTTP 200 geven én dezelfde tenant-id teruggeven. Daarna wordt de canarygebruiker verwijderd.

Er is dus geen permanent testwachtwoord, geen service-role secret in GitHub, geen canary-header in de business API en geen alternatieve klant-authenticatie.

## Terminal bewijs

Pas na protected merge en exact-main productie telt de artifact `.artifacts/portal-authenticated-production-canary.json` als bewijs. Die bevat alleen samenvattende counts, tenant-canary-id, HTTP-status en timestamps; geen klantpayload of credentials.
