# 2026-10-03 — approved central blog publication

- Obligation: `approved-central-blog|2026-10-03|wet-dba-en-zelfstandigen-wat-verandert-er-en-wat-betekent-dat-voor-jou`
- Candidate PR: #3618
- Changed public artifacts: blog page, blog index, RSS, sitemap.
- Failure observed: Required test run 37105316987 blocked material delivery because closure artifacts were absent.
- Recovery: add canonical learning, development ledger and human-readable change note on the same candidate branch.
- Terminal acceptance: Required test green → merge → production deploy → public readback of the exact slug.
