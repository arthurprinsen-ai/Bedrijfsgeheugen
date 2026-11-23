# Canonical development ledger — Security Agent Netlify import gap

- **Date:** 2026-11-02
- **Original obligation:** `powerhouse-security-agent-netlify-runtime-parity-20261102-v1`
- **Original incident:** `security|agent-roster|netlify-import-deployment-gap|20261102-v1`
- **Observed:** the Security Agent roster was merged in PR #5317 but the latest provider READY deployment continued to reference the preceding source commit.
- **Root cause:** shared Netlify runtime classification did not explicitly include the original agent registry despite real Netlify server function imports.
- **Scope:** central classifier, immutable release truth contract, existing Security Agent, existing security skill, test, machine learning and human change explanation.
- **Prevention:** runtime-import graph drives deployment requirements; stale provider SHA cannot satisfy live source; docs remain governance-only.
- **Release:** CANDIDATE, not live, until exact-head protected CI, CodeQL, BRAIN and independent original Netlify provider readback.
- **Separate open provider findings:** archived Netlify access and anonymous Supabase privileged RPC remain unresolved in the private incident lineage; do not turn green.
- **No new scheduler, writer, token, deploy hook or bypass.**
