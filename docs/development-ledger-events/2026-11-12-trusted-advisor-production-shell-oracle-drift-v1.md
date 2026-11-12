# Canonical brand-shell production oracle drift — 12 november 2026

- **Fingerprint:** `website|trusted-advisor-live-contract-oracle-drift|20261112-v1`
- **Owner:** original site-shell live readback verifier; parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5284
- **Failing production evidence:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43320591686, job 131540026216, `index.html: trustbalk mist “Vaste prijs, geen uurtje-factuurtje”`.
- **Actual website state:** Netlify `6af63e1c9ed9ad102dbe179c` READY, exact `839086756f2559b9abeb8decc8d945e2f0a3d919`; independent public home/contact/frisse-blik/zelfscan/en-contact/prijzen/over-ons/blog/en-home showed new NL/EN claims. Public homepage release marker has exact same SHA.
- **Cause:** original `tools/site-shell/live-contract.mjs` oracle and `tools/site-shell/test-live-contract.mjs` fixture still hard-coded pre-change promise; protected CI/source-generator test did not cover this verifier.
- **Correction:** synchronize current evidence-safe trustbar in the original verifier/fixture and link one executable BRAIN regression; preserve all other price, source, browser, growth GET-405, marker and timing assertions.
- **Prevention:** source contract parity must include both CI and independent production oracles whenever shared global copy changes. Do not retry an immutable false-negative or invent a deploy issue.
- **Release status:** `CODE_CANDIDATE`. Required, BRAIN, CodeQL, protected merge and genuine independent canonical production-verifier PASS still due.
- **Customer proof boundary:** original tenant BusinessInput -> ONE BRAIN -> Powerhouse/Heartbeat consumer processed ACK and 7/14/28-day customer impact are separate and unproven.
