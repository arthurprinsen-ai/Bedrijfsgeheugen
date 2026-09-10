#!/usr/bin/env bash
#
# Wacht tot een URL bereikbaar is, en zeg duidelijk wat er misging als dat niet lukt.
#
# Waarom dit script bestaat
# -------------------------
# Meerdere workflows wachten op dezelfde Netlify deploy preview, maar met heel
# verschillende vensters: 8, 16, 24, 30, 36, 40, 48 en 72 pogingen. Op 10
# september 2026 ging portal-v2-production-dom-readback rood met een 404 op
# /portal-v2/, terwijl portal-v2-live-preview op exact dezelfde preview gewoon
# slaagde. Het verschil was het venster: vijf minuten tegenover acht. De preview
# was kort daarna gewoon bereikbaar.
#
# Een check die rood gaat omdat hij te vroeg kijkt, meet niets. Erger nog: hij
# leert je rood te negeren. Dit script geeft alle wachters hetzelfde,
# realistische venster en logt bij mislukking de laatste HTTP-status en de
# verstreken tijd, zodat meteen zichtbaar is of de preview traag was of nooit
# is gebouwd.
#
# Gebruik:
#   bash tools/ci/wait-for-url.sh "https://preview.example/portal-v2/"
#
# Optioneel:
#   WACHT_POGINGEN   aantal pogingen (standaard 72)
#   WACHT_INTERVAL   seconden tussen pogingen (standaard 10, dus 12 minuten)
#   WACHT_LABEL      naam in de meldingen (standaard de URL)

set -euo pipefail

URL="${1:-}"
POGINGEN="${WACHT_POGINGEN:-72}"
INTERVAL="${WACHT_INTERVAL:-10}"
LABEL="${WACHT_LABEL:-$URL}"

if [ -z "$URL" ]; then
  echo "::error::wait-for-url.sh verwacht een URL als eerste argument."
  exit 2
fi

start=$(date +%s)
laatste_status="geen antwoord"

for poging in $(seq 1 "$POGINGEN"); do
  # Cache-buster per poging, zodat een tussentijds gepubliceerde deploy niet
  # achter een oud antwoord blijft hangen.
  scheider='?'
  case "$URL" in *\?*) scheider='&';; esac
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "${URL}${scheider}bg_wait=${poging}" 2>/dev/null || echo 000)
  laatste_status="$status"
  if [ "$status" = "200" ]; then
    verstreken=$(( $(date +%s) - start ))
    echo "${LABEL} is bereikbaar na ${verstreken}s (poging ${poging} van ${POGINGEN})."
    exit 0
  fi
  sleep "$INTERVAL"
done

verstreken=$(( $(date +%s) - start ))
echo "::error::${LABEL} werd niet bereikbaar binnen ${verstreken}s (${POGINGEN} pogingen). Laatste HTTP-status: ${laatste_status}."
if [ "$laatste_status" = "404" ]; then
  echo "::error::Een 404 na het volledige venster betekent doorgaans dat de deploy er wel is maar dit pad niet bevat, of dat de build is mislukt. Controleer de Netlify-deploy voordat je dit als codefout behandelt."
fi
exit 1
