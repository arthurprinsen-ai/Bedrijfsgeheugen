# Production route readback bounded parallelism — 25 september 2026

## Probleem

De exact-main production readback bewees de juiste Netlify SHA en connector readiness, maar de route-browsercontrole serialiseerde alle route × viewport combinaties. Door geneste retries kon deze stap het grootste deel van het terminale workflowbudget opsouperen voordat de pricing/i18n-interactieproof begon.

## Oplossing

- route × viewport observaties draaien parallel met begrensde concurrency;
- desktop 1440px en mobiel 390px blijven beide verplicht;
- navigatie- en visibility-retries zijn verlaagd en blijven fail-closed;
- de workflow geeft de routeverifier een harde wall-clock cap van 8 minuten.

Snelheid komt hiermee uit veilige parallelisatie, niet uit het overslaan van browserbewijs.
