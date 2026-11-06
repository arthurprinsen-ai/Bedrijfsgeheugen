# Actiecode bij de proefroute — 6 november 2026

Obligation: `checkout-promo-code:ai-kloof-2026q4`.

`afsluiten.html` leest `?code=` en toont bevestiging; `checkout-create.mjs` saneert en stuurt `promo_code` door; `bg-mollie-checkout` en `startTrial` bewaren hem in `saas_subscriptions.metadata.promo_code`. Test: `tests/brain-saas-promo-code-trial-20261106.test.mjs`. Geen migratie, geen scheduler, geen prijswijziging.
