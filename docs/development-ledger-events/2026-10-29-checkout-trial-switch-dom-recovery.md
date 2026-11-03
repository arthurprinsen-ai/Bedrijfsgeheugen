# Development ledger — checkout-trial-switch-dom-recovery (29-10-2026)

Obligation-ID: `powerhouse|website|checkout-trial-switch-dom|20261029`. Owner: existing website delivery lane / canonical Powerhouse writer.

Observed: Source checkout CTA requires #trialSwitch, but the built /afsluiten page browser test observed null; setTrialLink() raised TypeError on replaceChildren. The actual built-DOM normalization stage may remove this optional placeholder.

Change candidate: Recover the missing trial CTA placeholder inside the existing checkout form at runtime while preserving paid-versus-trial navigation and refusing to invent a payment state.

Prevention: Keep regression testing both pre-existing placeholder and missing placeholder on the real built checkout page; preserve paid/trial choice across NL and EN routes.

Files: `afsluiten.html`, `tests/brain-afsluiten-english-v1.test.mjs`, `brain/learning/2026-10-29-checkout-trial-switch-dom-recovery.json`, `docs/changes/2026-10-29-checkout-trial-switch-dom-recovery.md`, `docs/development-ledger-events/2026-10-29-checkout-trial-switch-dom-recovery.md`.

Evidence status: source written to protected candidate, not yet independently accepted. GitHub Actions admission is currently limited by provider API rate limiting; only bounded existing watchdog recovery is permitted. Production readback and closure stay **PENDING**, never inferred from an open PR.
