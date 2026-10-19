# Development ledger — portal visual collision recovery

- Date: 2026-10-19
- Obligation: `customer-portal-mobile-chart-overflow-recovery-20261019`
- Evidence: two iPhone screenshots showing overlapping/cut-off graphical labels and absent reliable hover/touch interaction.
- Root cause: legacy fixed-position SVG chart layout without adaptive labels and usable touch controls.
- Changed: `klantportaal.html`, `assets/js/portal-charts-v3.js`, `assets/css/portal-charts-v3.css`.
- Regression contract: `tests/brain-portal-charts-v3-mobile.test.mjs`.
- Provenance rule: visual market-percentile claims are not asserted unless independent source evidence exists.
- Integration state: PR candidate only. Required CI, CodeQL, protected merge, Netlify deployed-source verification, authenticated mobile visual acceptance remain open until provider readback.
- Project PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4495
