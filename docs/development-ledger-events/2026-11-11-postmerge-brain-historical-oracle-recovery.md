# Development ledger — BRAIN postmerge historical evidence recovery

- Date: 2026-11-11
- Original owner: ONE BRAIN/backend; parent issue #4198 and related #4215
- Fingerprint: `brain|delivery|postmerge-historical-824-and-model-directory-freshness|20261111-v1`
- Source: original BRAIN delivery run [43014341068](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43014341068) against merge SHA `550b020eeb3e03c6ffc7d0356cbb62c2ac4180ad`
- Observed: exactly 3 failed of 6313 backend tests: supplier research directory freshness globally assumed all 110 independently reverified; two historical native provider 823→824 assertions assumed ledger cannot append beyond #824 even though provider/source lock is 826.
- Root cause: obsolete global freshness release veto and frozen historical-count oracle, not a new business transaction failure or provider SQL drift.
- Correction: supplier evidence remains dated/stale in research-only items while auto-eligible models still require current 14-day independent proof; historical immutable 824-prefix is checked exactly and future append-only versions remain valid. Replay-only 824 fixture is separate from real current 826 ledger.
- Security: no provider migration edits, no API token, connector, scheduler, permissions, tenant data, live output, or model certification created. All existing negative tamper/permission/preview controls remain enforced.
- Evidence gate: protected Required/BRAIN/CodeQL; protected merge only if green; exact-main readback and independent next BRAIN delivery run. Until verified the candidate status is PENDING, not production repair.
- Follow-through: preserve #4198/#4215 and seven original red loops; no claim of provider publication, customer result, next-run learning, award-readiness or all-green.
