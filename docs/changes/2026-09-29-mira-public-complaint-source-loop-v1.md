# Mira public human-problem one-loop

Date: 2026-09-29
Fingerprint: `mira-public-complaint-source-loop-v1`

Mira remains a private/daily-life Instagram persona. Daily topics are selected from public evidence of real complaints and everyday friction, not from generic business content or calendar seeds.

Canonical lineage:

`public source -> problem signal -> quality/freshness/dedupe -> source-backed recommendation -> immutable daily winner -> OpenArt Mira Reel -> exact-media/Mira proof -> canonical publisher -> provider readback -> metrics -> social-learning evaluation -> lineage writeback -> next selection`

Production changes:
- `powerhouse-mira-problem-radar` is the source collector and scorer.
- `powerhouse_mira_problem_signals_v1` is the canonical signal store.
- `powerhouse_mira_problem_lineage_v1` is the single provenance/outcome/learning lineage.
- support/contact/FAQ pages are excluded from complaint eligibility.
- source-backed recommendation type is `source_backed_private_problem`.
- daily winner score contract is `instagram-mira-public-problem-score-v3`.
- winner selection requires a real `source_signal_id` and non-empty source URL lineage.
- exact source/hash reuse is blocked for 90 days; nearby same-topic repetition is blocked.
- social post, metric snapshot and learning evaluation updates converge on the same lineage.

Production readback for 2026-09-30 shows a source-backed package-delivery complaint from a public Reddit discussion selected into the canonical recommendation/winner/media-job lineage; the OpenArt Reel job is queued under the same winner ID.
