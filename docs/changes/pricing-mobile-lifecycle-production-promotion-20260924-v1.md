# Pricing mobile lifecycle production promotion — 24 september 2026

## Doel
Promoveer de beschermde main-commit `d55043434174a50b5d495563cc307d38f2db84c2` via de bestaande Production Source Snapshot naar Netlify production.

## Waarom
Netlify production serveert nog de vorige commit `be5ec08e69600acfdba31b28af0d6736c84917d6`. De lifecycle-fix is dus gemerged maar nog niet live bewezen.

## Canonieke route
Production Source Snapshot → GitHub OIDC → Netlify deploy bridge → provider ready → release.json exact SHA/context/deploy-id → pricing browser proof.

## Terminale grens
Geen LIVE_BEWEZEN zonder exacte provideridentiteit en werkende mobiele lifecycle + English-switch productie-interactie.
