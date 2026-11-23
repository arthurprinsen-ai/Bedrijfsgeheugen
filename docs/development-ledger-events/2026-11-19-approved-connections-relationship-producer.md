# 2026-11-19 — Goedgekeurde connecties krijgen een producer (append-only)

- Fingerprint: `powerhouse|commercial|approved-connections-without-predictive-brief-never-prepared|20261119-v1` (parent #4198)
- Gebeurtenis: `CONTRACT_CHANGE` — relatiepad in de dagelijkse connectie-activatie voor goedgekeurde ontvangers met functie en bedrijf (besluit 27 okt 2026); totaal dagbudget blijft 5.
- Eigenaar: powerhouse-connection-activation. Regressie: `tests/brain-connection-relationship-email-20261119.test.mjs`.
- Bewezen: brontests, selectie op echte data. Niet bewezen: migratie in productie, klaargezette actie, gegenereerd bericht, verzending, reactie.
