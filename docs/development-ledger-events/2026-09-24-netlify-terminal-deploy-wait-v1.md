# 2026-09-24 — Netlify terminal deploy wait v1

- Fingerprint: `netlify-terminal-deploy-wait-v1`
- Scope: production delivery / Netlify transport
- Root cause: `--no-wait` allowed a green transport step before terminal provider completion.
- Change: canonical Production Source Snapshot now waits for Netlify deploy completion before exact production identity proof.
- Verification: regression `tests/brain-netlify-terminal-deploy-wait-v1.test.mjs` plus existing exact-SHA and production browser gates.
- Completion rule: no `LIVE_BEWEZEN` until exact production SHA and interaction readback pass.
