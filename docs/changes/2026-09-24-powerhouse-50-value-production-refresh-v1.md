# Powerhouse 50 — Verified Value production refresh

Fingerprint: `powerhouse-50-outcome-ledger-verified-value-production-refresh-v1`

## Aanleiding
De Outcome Ledger / Verified Value Created-laag was via PR #2786 op protected `main` gemerged, maar de actuele Netlify-productiedeploy rapporteerde nog de voorafgaande commit.

## Herstel
Deze promotion-lineage wijzigt geen productfunctionaliteit. Zij activeert de bestaande canonieke `Production Source Snapshot` zodat exact de huidige main-bron via de bestaande GitHub OIDC → Netlify-route wordt gebouwd en gepubliceerd.

## Bewijscontract
`LIVE_BEWEZEN` is pas toegestaan wanneer:
1. de promotion via protected merge op `main` staat;
2. Netlify `state=ready` en `context=production` meldt;
3. de provider `commit_ref` de feature merge bevat of een descendant daarvan is;
4. main/production readback de Verified Value-koppeling naar canonieke `PH-Pxxx` bevat.

## Preventie
Een GitHub merge alleen is nooit productie-evidence. Bij production lag wordt dezelfde canonical snapshot/deploy-route gebruikt; geen alternatieve publisher of handmatige bypass.
