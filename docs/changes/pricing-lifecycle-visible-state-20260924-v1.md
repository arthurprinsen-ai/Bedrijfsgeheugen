# Pricing lifecycle visible-state fix — 24 September 2026

The new canonical production browser gate exposed a real live bug: clicking **Verlies & herstel** changed neither the visible panel state sufficiently for Playwright nor the required production contract.

The rescue runtime now makes lifecycle state explicit:
- active panel: `hidden` removed, `hidden=false`, `display:block!important`, `is-active`;
- inactive panels: `hidden`, `display:none!important`;
- selected stage is written to `data-bg-pricing-selected-stage` on `html`.

The production browser verifier remains the terminal oracle.
