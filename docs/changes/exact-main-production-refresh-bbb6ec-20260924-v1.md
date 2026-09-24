# Exact-main production refresh — 24 september 2026

## Aanleiding

De pricing/runtime-fix stond al in productie, maar de nieuwste `main` bevatte daarna alleen delivery-control-plane en documentatie. Netlify hoefde daardoor functioneel niets opnieuw te bouwen, terwijl de terminale deliveryregel een exacte production release identity op de actuele main-SHA eist.

## Oplossing

De bestaande canonieke `Production Source Snapshot` wordt expliciet geactiveerd. Daarmee wordt exact de huidige repository-source via de bestaande OIDC/Netlify-transportketen naar productie gebracht.

Er wordt geen branch protection omzeild en er wordt geen parallel deploymechanisme geïntroduceerd.

## Terminale bewijsketen

protected merge → Production Source Snapshot → exact Netlify production SHA → Production Release Readback → echte pricing lifecycle + NL/EN browserinteractie.
