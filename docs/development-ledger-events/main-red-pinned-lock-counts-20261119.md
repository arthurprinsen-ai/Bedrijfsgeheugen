# 2026-11-19 — MAIN_RED — vastgepinde aantallen en brontekst in tests

- **Signal:** `lanes (backend)` rood op main na #6051/#6052/#6054; 886 !== 884/883/882 en een regex op letterlijke brontekst.
- **Root cause:** verouderde assertievorm (totaalaantal en exacte tekst), geen regressie; provider en lock kloppen.
- **Fix:** vier tests herschreven naar uitkomst; lock, workflow en bron onaangeroerd.
- **Boundary:** pas bewezen na groene verplichte checks en `lanes` op main na merge.
