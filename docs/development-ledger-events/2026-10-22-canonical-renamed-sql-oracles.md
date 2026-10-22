# Append-only source-oracle repair — 2026-10-22

- Fingerprint: `powerhouse|brain|canonical-renamed-production-sql-oracles|20261022-v1`
- Three original BRAIN failures from two outdated migration filename aliases identified from https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- Both original SQL blobs verified byte-identical to the current canonical executable migration filenames.
- Only three test-source string reads in two original consumer test files repaired; no original assertion weakened, skipped or disabled.
- Regression: `tests/brain-canonical-renamed-production-sql-20261022.test.mjs`
- Two authentic source blobs: `c45901a1e162cb8936508018abc02416ad268364`, `135a2a08eddfed78aa1e888e8f697ec9edbee34d`.
- Change state: candidate, not full BRAIN or production green; #3742/#4215 remain open, no side effects.
