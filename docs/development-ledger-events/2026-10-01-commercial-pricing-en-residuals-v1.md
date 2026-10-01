# Development ledger — commercial pricing English residual cleanup

- Date: 2026-10-01
- Obligation: `commercial-pricing-en-residuals-20261001`
- Area: public pricing / i18n / commercial conversion
- Root cause: ordered string replacements allowed partially translated Dutch fragments to survive on the English pricing route.
- Change: added a deterministic final English residual cleanup pass and regression coverage.
- Expected production effect: `/en/prijzen` renders commercial SaaS and consulting copy fully in English.
- Verification required: protected merge, exact-main Netlify production deploy, public readback of `/en/prijzen`.
- Final root cause: `en/prijzen.html` inherited the commercial-pricing marker before the English composer ran, so the composer returned early. Guard changed to skip only the Dutch canonical source; English is always rebuilt deterministically.
- Final hardening: HTML escaping and token replacements could create transformed residuals and doubled whitespace (`30  days`). The English renderer now normalizes those forms and fails closed on known Dutch fragments.
