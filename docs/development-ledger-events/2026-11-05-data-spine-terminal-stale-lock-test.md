# 2026-11-05 — Source-backed data-spine postmerge terminal failure

- Fingerprint: `brain|postmerge|original-data-spine-lock-tail-no-longer-last|20261105-v1`.
- Original failed BRAIN run `42059928039`, backend job `127358913479`, terminal run `42059796291`; issue `#4198`. Do not rewrite historical failures.
- Original secure Git history test was correctly repaired in protected PR #5468; redundant initial candidate PR #5470 was closed unmerged.
- Only remaining BRAIN source mismatch: source migration `20261105132000` followed by legitimate immutable successor `20261105134200` (808 canonical rows). The old test froze last version, producing a test failure after normal append.
- Change solely existing `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs` to enforce original+successor exact identity and immutable chronology; BRAIN learning and human docs in same candidate.
- Required: protected exact-head CI, merge, new main BRAIN and terminal provider proof. No false claim of autonomous revenue or Google ranks.

- CI admission recovery on the same candidate: first Required run #42064379151 failed before executing tests because PR metadata contained a noncanonical `Supersedes: #5470 (...)` line. #5470 was a closed unmerged candidate, not an eligible machine predecessor. Removed the unsupported machine header, retained its reference as plain incident history; no security/hygiene gate bypass.
