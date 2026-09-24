# Powerhouse 50 production source promotion — 24 september 2026

## Aanleiding
Powerhouse 50 Problem Library v1 was beschermd gemerged naar main op `94fd9cb6f04118ea9da2d318d49114562f8ce2f5`, maar Netlify production serveerde nog een oudere deploy. Een latere main-commit repareerde de build parse error.

## Promotieroute
De bestaande `Production Source Snapshot` workflow is de canonieke productie-promotie: GitHub OIDC → Netlify deploy bridge → exact source deploy → release.json SHA/context/deploy-id → browser readback.

## Preventie
Geen ad-hoc deploys of extra truth stores. Een stale productieprovider wordt via één promotion obligation hersteld en een material workflow-refresh draagt learning, ledger en documentatie in dezelfde lineage.

## Exitcriterium
Pas `LIVE_BEWEZEN` na exact production readback van een main-descendant die Powerhouse 50 bevat.
