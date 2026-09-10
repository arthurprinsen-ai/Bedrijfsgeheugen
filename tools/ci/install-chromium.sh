#!/usr/bin/env bash
#
# Installeert Chromium voor Playwright zonder afhankelijk te zijn van
# apt-bronnen die wij niet nodig hebben.
#
# Waarom dit script bestaat
# -------------------------
# `playwright install --with-deps chromium` draait onder water `apt-get update`.
# De GitHub-runner heeft standaard de apt-bron van Google Chrome
# (dl.google.com/linux/chrome-stable) én die van Microsoft geconfigureerd.
# Google publiceert zijn Release-bestand meerdere keren per dag opnieuw; komt een
# build daar precies tussendoor, dan geeft apt "Hash Sum mismatch" en stopt de
# hele installatie met exit code 100. Op 9 september 2026 maakte dat twee checks
# rood (production-dom-readback en preview) op een PR waar niets mis mee was.
#
# Wij installeren Chromium via Playwright zelf en hebben die twee bronnen dus
# nergens voor nodig. Ze worden hier verwijderd voordat apt draait. Daarnaast
# drie pogingen met een schone apt-cache ertussen, voor het geval een spiegel
# tijdelijk uit de pas loopt.
#
# Gebruik in een workflow:
#   - name: Install Chromium
#     run: bash tools/ci/install-chromium.sh
#
# Optioneel:
#   PLAYWRIGHT_PACKAGE  npm-pakket dat eerst wordt geinstalleerd. Standaard
#                       @playwright/test@1.55.0. Gebruik "playwright@1.55.0"
#                       waar de workflow alleen de library nodig heeft, of
#                       "none" wanneer Playwright al via pip is geinstalleerd.
#   PLAYWRIGHT_CLI      commando dat de browser installeert. Standaard
#                       "npx playwright"; zet dit op "playwright" in de
#                       Python-workflows, waar er geen npm-pakket is.

set -euo pipefail

PLAYWRIGHT_PACKAGE="${PLAYWRIGHT_PACKAGE:-@playwright/test@1.55.0}"
PLAYWRIGHT_CLI="${PLAYWRIGHT_CLI:-npx playwright}"
POGINGEN="${POGINGEN:-3}"

verwijder_overbodige_apt_bronnen() {
  local bron
  for bron in /etc/apt/sources.list.d/google-chrome.list \
              /etc/apt/sources.list.d/google-chrome-*.list \
              /etc/apt/sources.list.d/microsoft-prod.list; do
    if [ -e "$bron" ]; then
      echo "apt-bron uitgeschakeld: $bron"
      sudo rm -f "$bron"
    fi
  done
}

if [ "$PLAYWRIGHT_PACKAGE" != "none" ]; then
  npm install --no-save --package-lock=false "$PLAYWRIGHT_PACKAGE"
fi

verwijder_overbodige_apt_bronnen

for poging in $(seq 1 "$POGINGEN"); do
  if $PLAYWRIGHT_CLI install --with-deps chromium; then
    echo "Chromium geïnstalleerd (poging $poging)."
    exit 0
  fi
  echo "::warning::Chromium-installatie mislukt bij poging $poging van $POGINGEN."
  if [ "$poging" -lt "$POGINGEN" ]; then
    sudo rm -rf /var/lib/apt/lists/*
    sudo apt-get update -o Acquire::Retries=3 >/dev/null 2>&1 || true
    sleep 15
  fi
done

echo "::error::Chromium kon na $POGINGEN pogingen niet worden geïnstalleerd."
exit 1
