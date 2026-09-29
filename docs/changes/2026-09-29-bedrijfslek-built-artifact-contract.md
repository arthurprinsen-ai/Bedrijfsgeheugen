# Bedrijfslek built-artifact guard — 29 september 2026

## Waarom
Een bronbestand kan correct zijn terwijl een latere websitegenerator of normalizer het uiteindelijke productie-artifact alsnog verandert. Voor een acquisitieroute is een broncode-test daarom niet voldoende.

## Wat verandert
De exacte Netlify build-parity gate voert na alle productie-transformaties ook de bestaande Bedrijfslek-regressietest uit. Daarmee wordt het gegenereerde `zelfscan.html` zelf gecontroleerd.

De gate blokkeert een release als de 12-vragen Bedrijfslek, value-before-PII, de portaal/order-route of de standalone route-authority verloren gaat.

## Effect
Bron → build → artifact → browser → productie blijft één gesloten delivery-lineage. Een toekomstige buildstap kan de acquisitieroute niet stilletjes terugzetten zonder dat Required test faalt.
