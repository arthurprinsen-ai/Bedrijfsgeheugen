# Development ledger — 2026-10-22 social learning current-source oracles

- Main epoch: `47f302f9be29be967e35d31edd0e76795f46945b`
- Fingerprint: `ci|social-learning|legacy-source-oracles-after-canonical-native-routing|20261022-v1`
- Parent P0: [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439)
- Triggering source: [Buffer Social Learning run 39828093988](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39828093988), three original failing assertions.
- Root cause: inherited source assertions refer to retired duplicate schedule, global publish literal and former vision error code, contrary to actual fail-closed native runtime.
- Action: three precise original source-contract test fixes, new regression, Brain learning and human-readable evidence. No production side effect or weakened gate.
- Prevention: re-run exact-head social contract on changes to channel scheduling, provider route or Mira verification. Never restore Buffer fallback; keep one canonical executor and exact external readback.
- Verification: PENDING exact-head Required, CodeQL, complete BRAIN zero-fail, protected merge and postmerge readback; candidate not PROVEN.

- Admission evidence: [run 39831225464](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39831225464) rejected direct `tests/social-*` evaluation paths. [Run 39831651154](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39831651154) rejected full original test imports because `@netlify/blobs` not installed in dependency-free admission. Repair retains dependency-free source contract in learning and introduces a separate Required-backend BRAIN wrapper importing all three original test modules; no skip. New head gates pending.
