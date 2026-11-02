# Original BRAIN two-measurement source regression: preserve source truth

2 November 2026. Parent issue #4439. Fingerprint: `powerhouse|brain|portal-two-measurement-stale-text-contract|20261102-v1`.

## Observed incident and exact root cause

Protected PR #5282 merged to `295c12ab94303af30b9b9fc30207d15ecf88db1e` and published on original Netlify deployment `6ae86dd8a73579a77a4c21eb`. Original postmerge BRAIN run [41433667027](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027), backend job 125238718390, observed **5400 total / 5397 passed / 1 failed / 2 skipped**. Only failed test #3050: `the original owner-only Portal renders two measurements and safe absolute GitHub href`.

The historic test expected the obsolete ambiguous label `Laatste vastgelegde BRAIN-hertest`; the original Portal UI now correctly shows `Laatste vastgelegde mislukte BRAIN-run` **and** `Geregistreerde latere BRAIN-herstelproef`. This is a stale test contract, not authority to erase a real failure or turn a historical failed run green.

## Exact source-only remedy

Update **the original existing test** to require both distinct labels, retain the original baseline label, assert the escaped absolute GitHub link for both the last failed run and later software recovery, preserve the original admin/authorization contract and explicit `geen onafhankelijke terminalafsluiting` warning. No API, billing, CMS, publisher, scheduler, Netlify runtime, customer or RLS change. Do not disable/skip a test or create a shadow owner.

## Acceptance and learning

Original ONE BRAIN agent ownership and the previously updated `.agents/skills/powerhouse-post-merge-codeql/SKILL.md` remain canonical. This change includes machine-enforceable historical/shadow/canary learning and append-only documentation. Protected exact-head Required, CodeQL, full original BRAIN 0-failure replay, protected merge and independent postmerge full BRAIN are mandatory. A source regression success is **not** a new paid order, full 15-loop green or a recurrence-free certification. Subsequent natural run must verify no recurrence. Fail closed otherwise.
