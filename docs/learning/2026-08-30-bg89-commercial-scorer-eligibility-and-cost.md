# BG89 Commercial Scorer Eligibility & Cost — 2026-08-30

## Incident / cost fingerprint
BG89 `Signal Fusion Engine - delta efficient` ran every 2 hours with a Notion create-watch, max 10 records. Recent successful runs repeatedly cost about 31 operations, 51–61 credits and ~0.97–1.15 MB transfer.

Fingerprint: `bg89|generic-datahub-watch|noncommercial-record-scoring|2026-08-30-v1`.

## Root causes
1. The trigger watches the generic Interaction Datahub and returns complete Notion page objects with a very wide schema. The Make Notion `watchDatabaseItems` module has no field-projection option.
2. Eligibility before scoring originally excluded only `Record Quality=Duplicate`. Generic system/control/health records therefore entered the commercial scorer.
3. The queue is a real backlog, not merely a duplicate loop: sampled records had Source Timestamp on 28 Aug and first received Opportunity Updated on 30 Aug. A point-in-time count showed 410 unscored non-duplicate/non-control records.
4. More than half of the backlog (234) was `LinkedIn Radar Heartbeat v21`. A fetched heartbeat explicitly states `coverage health only; no AI-call` and contains no person/company/intent/commercial evidence.
5. A `network_snapshot` emitted by BG143 also contained only operational network counts, yet BG89 assigned Opportunity Score, deadlines and WATCH advice.
6. Datahub control-plane mirror records were also scored commercially; this corrupted BG145 runtime configuration. That incident has a separate recovery ledger.

## Safe eligibility contract now applied before BG89 scoring
Module 2 filter excludes:
- `Record Quality = Duplicate`;
- `Data Source = Powerhouse Control Plane Runtime`;
- `Data Source = LinkedIn Radar Heartbeat v21`;
- `Data Source = Regression Test`;
- interaction text containing `network_snapshot`;
- records where `Opportunity Updated` already exists.

Do NOT exclude all BG143 Action Outcome records: that source also contains real user/commercial actions. Exclude exact operational event classes, not broad sources, unless evidence proves the whole source non-commercial.

## Runtime evidence
Before heartbeat exclusion, standard full batches were 31 ops and 51–61 credits.
After adding heartbeat exclusion, natural execution `b97fc302e50346f3b658be9ec9886757` received 10 trigger records but only 9 reached both scoring modules and writeback: 28 ops, 52 credits, ~931 KB. This proves the eligibility filter executes before scoring/writeback. The batch contained mostly legitimate DM records, so cost remained high for useful work.

A real DM bulk record was inspected and contained an inbound conversation plus human-action context; `Chrome DM bulk v25` must therefore remain eligible unless a more specific non-commercial subtype is proven.

## Backlog evidence
At measurement time, after excluding duplicates and control-plane records, backlog was 410. Source breakdown included:
- LinkedIn Radar Heartbeat v21: 234 — non-commercial, now excluded;
- Chrome DM bulk v25: 86 at initial count (later 79 after processing) — real DM evidence, keep;
- Powerhouse Interactive Cockpit v45: 28 — requires subtype-level eligibility, do not blanket exclude;
- other measurement/research/outcome sources in smaller volumes.

## Architecture lesson
The current Notion Watch trigger cannot project fields, so full-record transfer cannot be fixed inside the existing trigger. The future cost-safe architecture is:

`scheduled start -> Notion API query for unprocessed eligible commercial/evidence records -> filter_properties only consumed fields -> bounded iterator -> one deterministic scorer -> one deduplicated write`.

That migration must be shadow-tested against current BG89 outputs before cutover. Do not change the scoring formulas merely to reduce credits.

A second potential optimization is combining the two consecutive deterministic JavaScript scoring modules into one. Do this only in a clone with output-equivalence tests on representative DM, research, SEO/measurement and action records before production promotion.

## Regression contract
- System/control/health/test events MUST NOT enter commercial scoring.
- `Opportunity Updated` is the first-processing idempotency marker for current create-based semantics; a replayed already-scored record must stop before code/writeback.
- A Datahub record sharing the generic schema is not automatically a commercial signal.
- Source-level exclusions require evidence the entire source is non-commercial; otherwise use exact event/subtype exclusions.
- Preserve inbound DM/action urgency and downstream business semantics.
- Never reset the Notion Watch cursor/start point blindly; doing so can replay history or lose unprocessed obligations.
- Do not increase polling frequency to clear backlog. Remove non-useful candidates and improve deterministic throughput instead.
