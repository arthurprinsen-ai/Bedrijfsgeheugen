# Development ledger: Portal daily value portfolio

- Date: 2026-10-08
- Obligation: powerhouse-daily-value-portfolio-20261008-v1
- Baseline: existing Company Cockpit renders a broader decision list, but lacks a dedicated evidence-first top-three attention section.
- Implemented: deterministic top-three selector, duplicate filtering, explicit missing metrics, blocked/approval states and HTML escaping, integrated with existing Company Cockpit.
- Regression added: `node --test tests/portal-v2-daily-value-portfolio.test.mjs`.
- Verification: source and test were read back from GitHub; protected CI, production deploy and authenticated readback remain pending.
