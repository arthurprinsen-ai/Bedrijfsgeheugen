# Pricing build-oracle context parity — 25 september 2026

## Symptoom
Netlify production buildde exact main niet. Reproductie van het production-source artifact wees naar een stale pricing-contextcontract.

## Oorzaak
De actuele prijzenpagina gebruikt de multi-goalsemantiek `Wat wil je bereiken?` met `Ondernemersdoelen`. De production build-oracle en daarna nog één entitlement-regression verwachtten de verwijderde tekst `Belangrijkste doel nu`.

## Herstel
De production oracle op main gebruikt inmiddels de actuele semantiek. Deze recovery trekt de laatste entitlement-regression gelijk en borgt de learning.

## Preventie
Pagina, build-oracle en regressies moeten bij contextwijzigingen atomair dezelfde canonieke termen gebruiken. Een oude test is nooit reden om verwijderde productcopy terug te zetten.
