# Pricing build-oracle context parity — 25 september 2026

## Symptoom

De Netlify-productiebouw van exact main `abdfd8d7dd9bf08dbf95a9fb76a8d5266ef853c1` stopte vóór de i18n-stap. Reproductie met exact hetzelfde production-source artifact gaf:

`pricing integrity: missing canonical tokens: Belangrijkste doel nu`

## Oorzaak

De prijzenpagina en het Portal gebruiken inmiddels de multi-contextsemantiek `Wat wil je bereiken?` met de groep `Ondernemersdoelen`. De pre-build integrity-oracle controleerde nog de verwijderde single-goaltekst `Belangrijkste doel nu`.

## Herstel en preventie

De build-oracle controleert voortaan dezelfde multi-goaltermen als de actuele pagina. Een regressietest verbiedt de oude term expliciet. Bij toekomstige contextwijzigingen moeten pagina, componenttests, entitlementtests en production build-oracle in dezelfde lineage worden aangepast.
