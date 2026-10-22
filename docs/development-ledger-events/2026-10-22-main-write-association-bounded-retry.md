# Append-only development evidence — 2026-10-22

- Parent incident: #4657; root fingerprint `delivery|main-write|unverifiable-pr-association-v1`.
- Correct source owner: one existing `.github/workflows/main-write-integrity.yml`. No separate scheduled agent.
- Real failed run 39807485724 attempt 1; independent commit-to-PR readback confirmed merged #4658; rerun attempt 2 SUCCESS.
- Candidate base: `01af9f2a05794a170cd3fd63013db75a33e76268`. Changed only one workflow, one pure helper, one BRAIN test, canonical learning, docs and ledger.
- Root prevention: retry transient API/empty PR-association lookup with bounded delay; malformed/unknown/direct write remains fail-closed; preserve branch protection and release gates.
- Six local simulated regressions passed; exact PR Required/CodeQL and postmerge integrity still PENDING.

- Admission preflight blocked initial candidate with `unclassified delivery path` for `tools/main-write-pr-association-retry.mjs`; corrected within the same PR by relocating under existing approved `tools/ci/` scope, with no gate bypass.
