# Pin Chromium CI runner — 2026-10-19

Obligation-ID: `playwright-supported-ubuntu-runner-20261019`
Failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39216880329
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Observed
The browser proof never reached the application: Playwright 1.55.0's `install --with-deps chromium` refused Ubuntu 26.04 with an explicit unsupported OS error. Retrying the same environment three times did not help. This is a runner compatibility fault, not proof that the portal is broken.

## Minimal recovery
Pin each affected browser-proof workflow to `ubuntu-24.04`: Portal V2 DOM production readback, Portal V2 live preview, Production Source Snapshot, live preview smoke, V18 megamenu production readback, Portal visual density and cross-browser screenshot assurance. Do not suppress Chromium verification. Enforce the runner-label policy in `tests/brain-playwright-supported-runner-v1.test.mjs` and canonical Brain learning.

## Proof required
Required CI and CodeQL for exact candidate SHA; protected merge; successful browser install, actual DOM readback, and exact Netlify production deployment lineage. A code-only success without runner evidence is not terminal. Separate Playwright major upgrade would require its own test and review.
