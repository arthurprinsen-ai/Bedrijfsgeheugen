# Live-ready versus functioneel groen — Powerhouse borging 2026-09-29

## Kernregel

Powerhouse houdt voortaan twee waarheden expliciet uit elkaar:

- **LIVE / DEPLOYMENT_READY**: de exacte actuele `main` is door de provider als productie gepubliceerd en teruggelezen.
- **FUNCTIONAL_GREEN**: de betreffende functionele capability is daarna ook aantoonbaar buiten de build/deployketen gebruikt of teruggelezen.

Een productie-deploy mag dus live zijn zonder dat alle subketens automatisch groen zijn.

## Gevalideerd voorbeeld

Op 29 september 2026 stond Bedrijfsgeheugen als actuele Netlify-production deploy op commit `204269314239ea2cc56a00a0da1ed87a5056415f`, deploy `6abbdf73c4c7d80008d9811f`, status `ready`, context `production`.

Dat is geldig deploymentbewijs. Het is geen zelfstandig bewijs voor pricing-interacties, NL↔EN roundtrip, connector-readiness, social-publicatie, omzet/outcome of andere functionele contracts.

## Permanente consequenties

1. Dashboard- en chatstatussen tonen deployment truth en capability truth gescheiden.
2. Geen enkele agent/chat mag `ready`, `current`, een merge of een provider-ACK vertalen naar whole-system GREEN.
3. Iedere materiële live-promotie schrijft terug naar Brain learning, skill, agent/chat-contract, ledger/docs en Systeemkaart.
4. Dezelfde obligation blijft eigenaar tot de relevante functionele readback terminal is of een echte hard boundary is bereikt.
5. Toekomstige agents/chats voeren deze borging automatisch uit; de gebruiker hoeft dit niet opnieuw te vragen.

## Truth boundary

Dit document borgt het contract en de geobserveerde deployment-identiteit. Het claimt niet dat iedere Powerhouse-capability permanent groen is.
