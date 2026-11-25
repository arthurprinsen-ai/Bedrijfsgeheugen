# Development ledger — 2026-10-25 — oude bron als nieuwe Mira-actualiteit

- Fingerprint: `mira|source-freshness|source-observed-at-substituted-for-publication-date|20261025-v1`
- Parent: #4439; Obligation-ID: `mira:source-date-provenance-before-daily-winner:20261025-v1`
- Writer branch: `fix/mira-source-publication-freshness-20261025`; source owner: bestaande `powerhouse-mira-problem-radar` en `powerhouse_materialize_mira_problem_recommendation_v1`
- Geobserveerde fout: bron van 3 oktober 2022, pas op 24 oktober 2026 opnieuw gevonden, toch `freshness_score=0.8` en als `eligible` opgenomen in de dagwinnaar; vaste recency-constante en 10 dagen crawl-tijd vormen een ongeldige versheidsclaim.
- Causaal herstel: date-bound parser + producer false-green guard + database materializer on original publication date. Ongepubliceerde historische bronnen niet stilzwijgend herpubliceren. Bevroren dagwinnaar immutabel.
- Preventie: uitvoerbare test historisch + shadow + canary; expliciete onbekende datum als review-only, niet als actuele nieuwsbron; test backend datum plus migratie zonder nieuwe provider/scheduler.
- Echte volgende bewijzen: exact HEAD Required, CodeQL, provider preview, beschermde merge, Supabase exact source readback en 2 normale dagelijkse zoekcycli met datumdekking/geen valse actualiteit.
- State: CANDIDATE; no provider publication/outcome or paid order claim.
