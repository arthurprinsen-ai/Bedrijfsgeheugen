# Development ledger — Canonical portal chart remediation

- Date: 2026-10-19
- Obligation: `customer-portal-mobile-chart-overflow-recovery-20261019`
- Evidence: user iPhone screenshots, broken SVG text/interaction; PR #4495 targeted retired `klantportaal.html`, browser identity rejected `/klantportaal` redirected to `/portaal`.
- Prevention: inspect `_redirects` before any chart/source edit and test canonical actual entrypoint.
- Actual components: `portal-v2/visuals.js`, `portal-v2/index.html`, `portal-v2/chart-stages.css`.
- Assurance: `tests/brain-portal-v2-stage-charts-mobile-20261019.test.mjs`, existing `portal-visual-density` cadence.
- Live claim prohibited until protected CI, Netlify deploy lineage and mobile browser proof.
- Retired stale PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4495

## Aanvullende bevinding: exact screenshot-pad
De screenshotlabels `Handwerk`, `Geordend`, `bovenste 25%`, `Late majority` en CMMI worden daadwerkelijk gegenereerd door `portal-v2/modules/legacy-overview-complete.js`. Dit tweede renderpad is daarom in dezelfde PR gerepareerd: de oude SVG/rail blijft in de DOM voor bestaande broncontracten, maar wordt visueel vervangen door native `details/summary`-fases met containerqueries en concrete uitleg. De bestaande test `tests/portal-v2-legacy-interactive-graphs.test.mjs` is aangepast aan de nieuwe semantische interactie en behoudt het oude databroncontract. Browseracceptatie na merge blijft verplicht.
