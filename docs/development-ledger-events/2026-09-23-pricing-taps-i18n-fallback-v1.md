# 2026-09-23 — pricing tap and language recovery

User screenshots proved that rendered controls were not sufficient evidence of interaction correctness. A delegated mobile-safe pricing controller was added. The i18n build contract was also changed so offline releases cannot omit the English route tree while still exposing a language switcher that targets it.

Regression coverage now checks both interaction delegation and offline English-route fallback. Production remains unproven until deployment and public readback complete.


## 2026-09-24 production proof

- Exact production SHA: `be5ec08e69600acfdba31b28af0d6736c84917d6`
- Netlify deploy: `6ab538bfd5da670008277a4d`
- Provider identity/content: PASS
- Pricing interaction browser: FAIL at lifecycle `loss` mobile hitbox
- Root cause: build-integrity restored competing inline + rescue runtimes; proof also used wrong billing ARIA attribute
- Recovery lineage: PR #2676
- Terminal state: pending protected merge + exact provider/browser re-readback
