# CI website lane Chromium recovery — 2026-10-19
Obligation-ID: `website-browser-required-ci-ubuntu26-20261019`
Fingerprint: `delivery|website-lane|playwright-1.55-explicit-pin|ubuntu26-20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4455

Observed failure: 39218740644 website / browser, explicit old 1.55.0 pin overrides centralized compatible default. Fix only this workflow pin to 1.61.0 and protect with simple Node native test. No change to permissions, branch controls, Netlify transport, no publication and no browser-test bypass. Release only after Required CI, CodeQL, protected merge and independent production readback.
