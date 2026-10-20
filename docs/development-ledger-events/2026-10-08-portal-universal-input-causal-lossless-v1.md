# Development ledger — portal-universal-input-causal-lossless-20261008-v1

- Datum: 2026-10-08.
- Canonical issue: #4211.
- Owner: Portal V2 existing Brain BusinessInput writeback.
- Main epoch at start: `ce7d9993d274a0ee755993109cd3f667a93a2127`.
- Code: `portal-v2/domain-state.js`.
- Tests: `portal-v2/tests/portal-causal-propagation.test.mjs`.
- Defect A: afkappen na 50 causal impacts zonder bewijs.
- Defect B: clear-all tijdens asynchrone state/Brain saves, met mogelijk verlies van latere input.
- Defect C: `portal.pages.<page>` geaggregeerd tot generiek niet-pagina-gebonden model.
- Fix: verliesvrije generatiegebaseerde ACK, niet-GREEN wanneer state dirty, individuele page model lineage.
- Werkwijze: bestaande tenantgebonden Supabase/Brain contracten; geen tweede bron van waarheid.
- Externe effecten: geen echte klantinput, geen provider-/cloudinstallatie, geen commercieel bericht.
- Leveringsstatus bij auteurschap: candidate; beschermde merge en exacte Netlify + geauthenticeerde Brain-readback ontbreken nog.
- Opvolgverificatie: volledige inventarisatie van alle schrijfbare velden en externe adapters apart verplicht; niet als gereed beschouwen op basis van deze reparatie.
