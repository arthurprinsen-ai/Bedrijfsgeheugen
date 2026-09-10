#!/usr/bin/env bash
#
# Wacht tot een URL bereikbaar is. Bedoeld voor readbacks die op een Netlify
# deploy preview draaien.
#
# Waarom dit script bestaat
# -------------------------
# De readback van Portal V2 wachtte dertig pogingen van tien seconden: vijf
# minuten. Een deploy preview van deze repo is soms later klaar. Op 10 september
# 2026 ging production-dom-readback daardoor rood met een 404 op
# /portal-v2/, terwijl diezelfde preview kort erna gewoon bereikbaar was. Een
# check die rood gaat omdat hij te vroeg keek, leert je rood negeren — precies
# wat we in #1339, #1342, #1345 en #1347 hebben opgeruimd.
#
# Wat dit script anders doet dan een kale lus:
#   - een venster dat past bij hoe lang een preview er werkelijk over doet;
#   - het logt hoeveel pogingen en hoeveel tijd het kostte, ook bij succes, zodat
#     zichtbaar wordt of het venster krap begint te worden;
#   - bij mislukking meldt het de laatste HTTP-status, zodat een 404 (nog niet
#     gedeployed) te onderscheiden is van een 500 (kapot).
#
# Gebruik:
#   bash tools/ci/wait-for-url.sh "https://voorbeeld.nl/portal-v2/"
#
# Optioneel:
#   POGINGEN   aantal pogingen, standaard 72
#   INTERVAL   seconden tussen pogingen, standaard 10  (samen: 12 minuten)
#   CACHEBUST  queryparameter om caching te omzeilen, standaard bg_wait

set -euo pipefail

URL="${1:?geef de URL mee die bereikbaar moet worden}"
POGINGEN="${POGINGEN:-72}"
INTERVAL="${INTERVAL:-10}"
CACHEBUST="${CACHEBUST:-bg_wait}"

scheiding='?'
case "$URL" in *\?*) scheiding='&';; esac

start=$(date +%s)
laatste_status='geen antwoord'

for poging in $(seq 1 "$POGINGEN"); do
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
    "${URL}${scheiding}${CACHEBUST}=${poging}" || echo '000')
  laatste_status="$status"
  if [ "$status" = "200" ]; then
    verstreken=$(( $(date +%s) - start ))
    echo "Bereikbaar na ${poging} pogingen (${verstreken}s): ${URL}"
    marge=$(( POGINGEN * INTERVAL ))
    if [ "$verstreken" -gt $(( marge / 2 )) ]; then
      echo "::warning::Het wachtvenster is voor de helft opgebruikt (${verstreken}s van ${marge}s). Overweeg het te verruimen."
    fi
    exit 0
  fi
  sleep "$INTERVAL"
done

verstreken=$(( $(date +%s) - start ))
echo "::error::Niet bereikbaar na ${POGINGEN} pogingen (${verstreken}s): ${URL} — laatste status ${laatste_status}."
if [ "$laatste_status" = "404" ]; then
  echo "::error::Een 404 betekent hier meestal dat de deploy nog niet klaar was, niet dat de pagina stuk is."
fi
exit 1
