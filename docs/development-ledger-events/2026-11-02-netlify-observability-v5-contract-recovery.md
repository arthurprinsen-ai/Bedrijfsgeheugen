# 2026-11-02 – original Netlify publication proof version fixture drift

- **Fingerprint:** `powerhouse|brain|netlify-observability-v2-v5-test-drift|20261102-v1`, parent #4439.
- **Failed source run:** original full BRAIN #41416918147 backend #125183392982: 5377 executed, 5347 passed, 28 failed.
- **Root:** old `tests/brain-netlify-observability-release-parity-20261029.test.mjs` expects v2; original Netlify `powerhouse-observability.mjs` and dedicated production social-publication diagnostics already require v5.
- **Correction:** only stale original test updated to require v5 in runtime + aligned existing diagnostics and prohibit v2. Original AGENTS, recovery skill, ONE BRAIN learning (historical/shadow/canary) and human runbook updated within one protected candidate.
- **No side effects:** no runtime/auth/provider/CMS/scheduler/SQL/customer updates or fabricated proof; admin and tenant gating remain mandatory.
- **Proof due:** targeted tests, protected Required/CodeQL, exact postmerge full BRAIN/terminal, Netlify exact production deploy and owner-only Portal readback; no claims of green/paid order without independent provider evidence.
