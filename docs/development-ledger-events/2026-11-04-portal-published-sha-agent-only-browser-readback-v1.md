# Portal original browser release-fence extension ledger

- Date: 2026-11-04; original owner Portal V2 UX/QA and existing GitHub Actions `portal-v2-production-dom-readback.yml`, no new executor.
- Published provider: Netlify deploy `6aeb29401ec7ec2b37b0ebd0` READY, main commit `5f613a1802c9ece6d4023beef1c6a058caf9db22`.
- Existing original production browser [run #41832239828](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41832239828), job 126582051235, observed **14 PASS, 1 FAIL, 1 SKIP**; one strict nested-16-summary Playwright locator. Protected test correction #5412 already on main `e92994d4...`.
- Root cause of readback follow-up: original manual earlier-published-SHA diff fence allowed docs/tests but omitted AGENTS.md and existing skill Markdown, which are not runtime JS/CSS. A later protected test-only merge thus cannot be independently browser-verified against the exact unchanged production. This is a verification capability gap, not an observed security-challenge success.
- Correction: modify only original published-SHA change whitelist for exactly `AGENTS.md` and `.agents/skills/*`; preserve live-code, function, migration, credentials and role-security fail-closed behavior.
- Proof before closing: protected Required+CodeQL on exact head, original workflow dispatch on main with approved protected PR and exact immutable provider release SHA, actual 15 browser tests pass and original returned execution URL/ID. Never update incident to green on CI source tests alone.
- Expected issue learning fingerprint: `portal|ux|production-dom-progressive-disclosure-parity|20261104-v1` remains OPEN until independent browser pass and any separate authenticated human test.
