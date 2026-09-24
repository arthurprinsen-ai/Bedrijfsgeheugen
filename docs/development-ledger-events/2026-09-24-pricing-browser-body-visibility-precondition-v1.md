# 2026-09-24 — Pricing browser body visibility precondition

- Fingerprint: `pricing-browser-body-visibility-precondition-20260924-v1`
- Production SHA: `4623d87946758e3e2749a387999c75067b34ac9b`
- Netlify deploy: `6ab5406de12f6a0008fdd1f7`
- Failed readback: run `36019820451`, job `107701643277`.
- Failure: pricing verifier timed out on generic `body visible` before the first interaction.
- Fix: wait for body attachment + pricing readiness; retain normal control clicks; require visible English Pricing text after language switch.
- Terminal closure remains exact production SHA + successful pricing/i18n browser proof.
