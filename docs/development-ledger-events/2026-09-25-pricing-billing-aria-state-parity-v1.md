# 2026-09-25 — Pricing billing ARIA state parity

Observed: current-main production reached Netlify successfully; final Playwright proof failed because the yearly billing control remained `aria-selected != true` after click.

Permanent repair: billing runtime now synchronizes `aria-pressed` and `aria-selected`; regression coverage locks both; production pricing+i18n browser proof remains the terminal gate.
