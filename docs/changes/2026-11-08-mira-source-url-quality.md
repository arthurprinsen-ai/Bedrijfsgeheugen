# 2026-11-08 — Mira-radar weigert redirect- en zoekbronnen

Status: OBSERVED tot een natuurlijke radar-run.

De radar liet een google.com-redirect toe als bron voor de dagwinnaar van 6 november. De nieuwe helper `supabase/functions/_shared/mira-source-url-quality.mjs` weigert redirect-, zoek- en linkverkorter-hosts en `url=`-redirectparameters. `powerhouse-mira-problem-radar` slaat zulke bronnen over voordat ze worden opgeslagen.

Gezichtsdrempel 0,940 en temporele drempel 0,900 zijn ongewijzigd. Dit lost niet op dat de producer de mediajob niet claimt; dat staat in `docs/changes/2026-11-08-mira-fifteen-days-zero-reels.md` en vraagt een besluit over OpenArt-credits.

Learning: `brain/learning/2026-11-08-mira-source-url-quality-v1.json`. Regressie: `tests/brain-mira-source-url-quality-20261108.test.mjs`.
