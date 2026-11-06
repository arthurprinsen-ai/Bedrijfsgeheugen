# Kwartaalrapporten in het portaal

Datum: 6 november 2026

Nieuwe pagina `kwartaalrapporten` in Portal V2 (groep Actueel & externe data, vanaf plan starter). De pagina leest `portal-v2/reports/manifest.json` en toont elke editie met download van PDF en database. De eerste editie is "De AI-kloof in het mkb" 2026-Q4.

Een nieuwe editie is een nieuwe rij in het manifest plus de bestanden. De generator staat in `portal-v2/reports/ai-kloof/source/` met README. Geen scheduler, geen tabel, geen migratie, geen schrijfroute en geen klantdata.

Test: `tests/brain-portal-kwartaalrapporten-20261106.test.mjs` controleert dat elk manifestbestand bestaat en een echt PDF is, dat de nieuwste editie eerst staat, dat externe links en HTML worden geweerd en dat de pagina is aangesloten.
