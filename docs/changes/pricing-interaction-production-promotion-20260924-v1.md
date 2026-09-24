# Pricing interaction production promotion — 24 september 2026

## Doel
Promoveer protected main `4623d87946758e3e2749a387999c75067b34ac9b` naar Netlify production via de bestaande Production Source Snapshot.

## Reden
De product- en buildfixes zijn gemerged, maar production serveert nog `d55043434174a50b5d495563cc307d38f2db84c2`.

## Canonieke route
Production Source Snapshot → GitHub OIDC → Netlify deploy bridge → provider ready → release.json / deploy identity → productie browserreadback.

## Bewijsgrens
LIVE_BEWEZEN pas wanneer de live commit `4623d87946758e3e2749a387999c75067b34ac9b` of een descendant daarvan is en pricing lifecycle, billing en English-switch daadwerkelijk werken.
