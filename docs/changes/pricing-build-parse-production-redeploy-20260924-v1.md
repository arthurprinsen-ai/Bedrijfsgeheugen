# Pricing build parse production recovery — 24 september 2026

## Root cause
De Netlify production-build faalde met exit code 2. Reproductie op het exacte production-source artifact toonde een JavaScript `SyntaxError` in `tools/site-shell/pricing-build-integrity.mjs`: de nieuw toegevoegde RegExp-string gebruikte ongeldige quote-escaping.

PR #2764 heeft de parsefout op `main` gerepareerd door de RegExp-constructies syntactisch veilig te maken.

## Deze release
Deze lineage voegt drie dingen toe:
1. `node --check` regressiebewijs voor de production-critical buildscript;
2. continuity-skillwriteback zodat exit-code-2 eerst exact wordt gereproduceerd;
3. een operationele Production Source Snapshot-refresh zodat de parsefixed `main` werkelijk naar Netlify kan.

## Terminal bewijs
Geen `LIVE_BEWEZEN` zonder Netlify provider-success, exacte `release.json` SHA/context/deploy-id en productie-browserreadback.
