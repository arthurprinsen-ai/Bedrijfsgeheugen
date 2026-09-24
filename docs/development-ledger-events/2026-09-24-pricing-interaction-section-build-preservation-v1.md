# 2026-09-24 — Pricing interaction section build preservation

- Fingerprint: `pricing-interaction-section-build-preservation-20260924-v1`
- Production source SHA: `be5ec08e69600acfdba31b28af0d6736c84917d6`
- Netlify deploy: `6ab5392e62dd995771d76b00`
- Failed browser evidence: snapshot run `36015748370`, readback run `36015748460`.
- Symptom: productie-browser vond `[data-bg-stage="loss"]` niet.
- Root cause: restore dekte alleen `#pakketten`; interactieve controls staan in `#prijzen-pakketten`.
- Fix: beide secties atomair herstellen en selectors fail-closed valideren.
- Terminal status: pas sluiten na exact-SHA production deploy en groene pricing/i18n browsergate.
