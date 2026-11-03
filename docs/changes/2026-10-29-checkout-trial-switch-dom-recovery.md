# Herstelkandidaat — checkout-trial-switch-dom-recovery

Fingerprint: `powerhouse|website|checkout-trial-switch-dom|20261029`. Status: **CANDIDATE / NOT LIVE / CI PENDING**.

## Aantoonbare fout
Source checkout CTA requires #trialSwitch, but the built /afsluiten page browser test observed null; setTrialLink() raised TypeError on replaceChildren. The actual built-DOM normalization stage may remove this optional placeholder.

## Wijziging
Recover the missing trial CTA placeholder inside the existing checkout form at runtime while preserving paid-versus-trial navigation and refusing to invent a payment state.

## Structurele preventie
Keep regression testing both pre-existing placeholder and missing placeholder on the real built checkout page; preserve paid/trial choice across NL and EN routes.

## Acceptatie
- Regressie: `tests/brain-afsluiten-english-v1.test.mjs`
- Protected Required + CodeQL on immutable PR head; respect canonical writer lease and branch protection.
- Exact GitHub main to Netlify production identity plus independent public route/API readback.
- For portal: two separate real JWT-authenticated *synthetic* tenants, negative isolation proof and successful deletion; this does not establish access to actual customer accounts.
- No new publisher, scheduler, provider spend, synthetic sales outcome or green status before verification.

Referenties: #4577.
