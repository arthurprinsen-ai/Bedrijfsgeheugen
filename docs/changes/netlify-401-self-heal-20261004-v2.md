# Netlify exact-source 401 self-heal v2

## Aanleiding
De productie-transportlaag faalde op 4 oktober 2026 opnieuw op de eerste exact-source upload met `401 Unauthorized`, ondanks succesvolle GitHub OIDC- en bridge-acquisitie. De identieke SHA werd na een workflow-retry wel succesvol gepubliceerd.

## Structureel herstel
De exact-source upload haalt nu **binnen elke bounded transportpoging** opnieuw:
1. een GitHub OIDC-token op;
2. een verse proxy van `netlify-deploy-bridge`;
3. en voert pas daarna de Netlify MCP-upload uit.

Alleen een expliciete `401 Unauthorized` mag opnieuw proberen. Een andere transportfout blijft fail-closed. Er zijn maximaal drie pogingen.

## Waarheidscontract
Een geslaagde transportretry is nooit op zichzelf LIVE-bewijs. De bestaande controles blijven verplicht:
- provider build is ready;
- production `release.json` bevat de verwachte commit of een veilige descendant;
- immutable deployment identity bestaat;
- browser/readback bevestigt de productieoppervlakte.

## Geen bronwijziging bij retry
Elke retry gebruikt dezelfde checkout en dezelfde `GITHUB_SHA`. De herstelroute creëert dus geen nieuwe candidate, commit of afwijkende bronstate.
