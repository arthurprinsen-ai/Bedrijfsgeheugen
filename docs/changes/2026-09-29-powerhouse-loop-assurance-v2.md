# Powerhouse Loop Assurance v2

Op 29 september 2026 is aan Powerhouse een permanente loop-integriteitscontroller toegevoegd.

De controller controleert iedere vijf minuten of geregistreerde operationele loops niet alleen bestaan, maar nog aantoonbaar gesloten zijn. Per loop worden scheduler/runtime-versheid en acht bewijspunten bewaakt: input, beslissing, actie, readback, resultaat, meting, learning en guard.

Statusbetekenis:
- **GREEN** — de hele keten is actueel bewezen;
- **AMBER** — de keten draait, maar bewijs is onvolledig of begint te verouderen;
- **RED** — scheduler/runtime ontbreekt, is uitgeschakeld of is buiten de toegestane versheidsgrens geraakt.

AMBER/RED eindigt niet als losse melding. De controller schrijft dezelfde afwijking als `OPERATIONS_ASSURANCE` naar de bestaande Brain-obligationruimte. Daarmee wordt een opnieuw geopende loop onderdeel van de bestaande herstelketen.

De eerste productierun was bewust fail-closed: de bestaande loops werden AMBER omdat historische workflows nog niet alle acht expliciete stage-receipts produceren. Daardoor kan het systeem vanaf nu niet meer “groen” lijken op alleen succesmeldingen.

Deze status wordt bij iedere assurance-run opnieuw berekend; eerdere GREEN-status is nooit permanent bewijs voor een latere run.
