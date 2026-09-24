# Production readback handmatige exact-main modus — 24 september 2026

## Probleem

De canonical Production Release Readback draaide alleen op push en gebruikt `cancel-in-progress`. Een nieuwere main-commit kan daardoor een lopende functionele browserproof annuleren. Als de opvolgende commit zelf geen websitewijziging bevat, kan de opvolgende readback technisch groen zijn terwijl pricing/i18n functioneel niet opnieuw is bewezen.

## Oplossing

De workflow ondersteunt nu `workflow_dispatch` voor een handmatige exact-main readback zonder bronwijziging.

Bij manual readback:
- wordt browser-verificatie verplicht;
- wordt `/prijzen` altijd meegenomen;
- blijft exacte release-identiteit verplicht;
- draait de echte Playwright pricing/i18n-verifier;
- verandert er geen productcode alleen om bewijs opnieuw te genereren.

## Terminale regel

Een geslaagde workflowrun is niet voldoende wanneer functionele browserstappen zijn overgeslagen of geannuleerd. `LIVE_BEWEZEN` vereist exact production SHA + provider/deploy identity + echte pricing/i18n browserproof.
