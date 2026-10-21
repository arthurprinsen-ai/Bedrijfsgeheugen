# Historische BRAIN content-loop brontests herstellen — 21 oktober 2026

Fingerprint: `ci|brain-baseline|content-loop-repository-history-pointers|20261021-v1`. Obligation: `ci-inherited-content-closed-loop-history-pointers-20261021`. Parent [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), related [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215), blocked [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573).

## Werkelijke oorzaak
De bestaande test `tests/brain-content-closed-loop-contract.test.mjs` las drie oude SQL-bronnen via `supabase/migrations/`, terwijl de canonieke bron al naar `supabase/migration-history/repository-only/` is gereconcilieerd. De actieve Supabase-migratiemap mag geen kopieën of lege placeholders van deze historische bestanden bevatten.

## Bronbewijs vóór codewijziging
Originele immutable Git-blob SHA's: reconciliation `e0c96e7991707e70e86c63ec72e8ad2fd0db7a06`, scheduler `640349abbea56d0392619f4d594f01519819b751`, identity `222906e1e9196b6e5dae7901613d95848a211fe4`. Alle 23 bestaande source-markerpatronen zijn in de originele historische SQL aangetroffen (8 + 10 + 5). Dat is bronverificatie, **geen** Node/CI- of database-runtimebewijs.

## Exacte reparatie
Vervang uitsluitend de drie `read(...)`-paden met de exacte archive-identiteiten. Behoud de oorspronkelijke inhoudelijke matchers voor provider-truth, reconciliatie, één scheduler, fail-closed legacy detectie en onveranderlijke identity guard. Geen scheduler, SQL-migratie, klantenregistratie, credentials, endpoint, Brain writer of productie gewijzigd.

## Grenzen
De 355 historische backendfouten zijn niet als opgelost aangemerkt door drie padwijzigingen. Required CI, CodeQL, volledige exact-head BRAIN-tests, beschermde merge en provider-readback blijven harde vereisten. Twee afzonderlijke geauthenticeerde echte Portal V2-klanten, de externe connectoruitvoering en gevalideerde financiële prognoses blijven onder #4215 nodig. Deze verandering is een afzonderlijke niet-conflicterende backendtest-reparatie, geen nieuwe klantendataketen.
