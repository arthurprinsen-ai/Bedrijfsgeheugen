# Planned-action advisor trigger hard negatives — development ledger

- 2026-11-07, owner: existing planned-action guard triggers (config only plus one test); no new mechanism.
- Fingerprint: `delivery|preflight|planned-action-advisor-hard-negative|20261107-v1`.
- Source: owner instruction to record every failure and never repeat it; two defects found in the same trigger (too loose, then too narrow).
- Repair: pinned real hard negatives and positives, mutation check, widened action words for one rule.
- Known limit: hand-picked examples; recall of the 19 rules is NOT_MEASURED (#5510).
- Status: CODE_CANDIDATE until protected Required, CodeQL and terminal closure agree.
