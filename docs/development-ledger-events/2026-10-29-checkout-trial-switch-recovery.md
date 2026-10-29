# Development ledger — checkout trial-switch null guard — 2026-10-29

Obligation: `powerhouse|website|checkout-trialswitch-null|20261029`
Owner: website/checkout recovery, existing single protected GitHub writer.
Observed failure: GitHub Actions page scanner #40889498268, `/afsluiten` → `TypeError: Cannot read properties of null (reading 'replaceChildren')`.
Root cause: runtime DOM missing `#trialSwitch` despite source HTML; unguarded `getElementById`.
Changes: `afsluiten.html` and deterministic two-case regression `tests/checkout-trial-switch-recovery.test.mjs`.
Local proof: 2 mock DOM execution cases passed before creating the candidate; no live browser proof or merge verified.
Next gates: protected exact-head Required/CodeQL, generated-site checkout browser E2E, Netlify exact deploy and public production readback. No synthetic green; no duplicates, new sender, scheduler or billing mutation.
