# Powerhouse Loop Assurance v3

## Waarom deze wijziging
De bestaande v2-meta-loop controleerde iedere vijf minuten of schedulers/runtime actief waren en of acht gesloten-loopstadia bewijs hadden. In productie bleken alle twaalf geregistreerde loops echter aanvankelijk 0/8 stage-receipts te hebben. Daardoor kon de controller niet betrouwbaar onderscheiden tussen “de techniek draait” en “de volledige business-loop is aantoonbaar gesloten”.

## Wat v3 verandert
- Bestaande cron- en runtime-events worden conservatief vertaald naar stage-receipts.
- Er wordt geen outcome-, learning- of guard-bewijs verzonnen.
- Een kritieke loop met nul vers stage-bewijs is RED in plaats van onbeperkt AMBER.
- Gedeeltelijk bewijs blijft AMBER.
- GREEN vereist vers bewijs voor alle vereiste stadia.
- De totale toestand van alle geregistreerde loops is beschikbaar via `powerhouse_loop_integrity_health_v1`.
- Brain obligations behouden hun immutabele identiteit.

## Operationeel gevolg
“Een loop was vorige week dicht” is geen status meer. De vijf-minutencontroller moet de sluiting opnieuw kunnen bewijzen. Ontbreekt bewijs, dan blijft of wordt de loop AMBER/RED en blijft de assurance-obligation open totdat de canonieke uitvoering opnieuw bewijs schrijft.

## Productiebewijs op 29 september 2026
Na activering van de receipt bridge rapporteerde de controller twaalf geregistreerde loops: 0 GREEN, 11 AMBER en 1 RED. Dat is geen regressie maar een scherpere waarheidsgrens: incomplete evidence wordt niet meer als gesloten geïnterpreteerd.
