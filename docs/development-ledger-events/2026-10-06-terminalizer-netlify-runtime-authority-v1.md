# Development ledger — terminalizer-netlify-runtime-authority-20261006-v1

- Originating obligation: production-readback-pricing-contract-drift-20261005-v2.
- Originating terminal blocker: PR #3815 terminalizer -> `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.
- Runtime path that exposed the defect: `tools/site-shell/apply-commercial-pricing-v1.mjs`.
- Current production at investigation time: Netlify deploy ready/current on commit `2fa5fa60f248a5f14d86426cb835c447ab291cd3`.
- Root cause: split path authority between canonical production-readback contract and hardcoded terminalizer runtime list.
- Fix: contract-owned Netlify runtime prefixes/paths + shared JS classifier + terminalizer delegation + regression.
- Closure condition: exact-HEAD CI green -> protected auto-merge -> post-merge terminalizer succeeds for the same obligation -> terminal evidence reports LIVE_BEWEZEN.
