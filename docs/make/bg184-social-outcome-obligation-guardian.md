# BG184 — Social Outcome Obligation Guardian

## Identity
- Make scenario: `7147086`
- Name: `BG 184 - Social Outcome Obligation Guardian v1`
- Schedule: every `3600` seconds.
- Central media calendar data source: `626e4c3c-cfee-4390-b519-6a910538607d`.

## Purpose
BG184 is the first production reference adapter for the whole-brain obligation contract. It does not ask whether a social publishing workflow ran; it asks whether each due channel outcome exists.

A technically successful social window with a **zero-candidate** result is **RED** once a scheduled channel obligation is more than the bounded grace period overdue.

## Due semantics
The guardian calculates the same channel-time rules as the native publishers and applies a **10 minute** grace period after the due time. It checks only real non-test records.

Channel outcome evidence is:
- personal LinkedIn: non-empty `Post ID LinkedIn`;
- LinkedIn company: non-empty `Bedrijfspaginapost`;
- Instagram: non-empty `Post ID Instagram` plus native verification/status when written by the executor.

These external platform IDs are the outcome evidence. `success` from BG184, a social window or the publisher is not sufficient without them.

## Safe deterministic repair
BG184 may repair only a stale release-state gap when substantive automated QA is already green. The current safety evidence is based on the existing content release contract: correct red-thread check, channel text ready, test mode off, sufficient channel text, correct media/asset rule, and `Visual QA=Auto-safe` for image publication. Explicit rejection/blocking is never overridden.

When safe, BG184 updates only release-state fields needed by the existing publisher contract and invokes the existing native executors **idempotently**:
- BG171 LinkedIn executor: `7140072`;
- BG179 Instagram executor: `7140394`.

The native executors already query for empty channel IDs and write platform IDs after successful publication/verification, preventing duplicate side effects on subsequent guardian runs.

## Governed escalation
When an obligation is due but substantive QA is not safely satisfied, BG184 does not publish by bypassing controls. It:
1. writes an `ERROR` through BG168 `7136176`;
2. dispatches governed GREEN-UNTIL-DONE recovery to BG156 `7132258`;
3. leaves the record discoverable as RED until actual outcome evidence appears.

The BG156 event envelope contract is exact: it must contain top-level `type` and `source`. The first BG184 escalation used an incompatible `event_type` shape and BG156 execution `88d100e8e44d40b4804a0290698fcb43` rejected it with `INVALID_EVENT_ENVELOPE`. BG184 was corrected to emit `type="ERROR"` and `source="BG184"`, with evidence nested under `evidence`.

## 2026-08-29 reference recovery
Planned item `Vormtest — mensen zijn niet slordig` was due but excluded from BG171 because `Publicatiecheck=Niet gecontroleerd`, `Make status=Wachten`, and `Herzien` was empty despite substantive QA being green.

The safe recovery repaired those release-state fields and ran the existing native executors. Verified outcomes:
- LinkedIn personal: `urn:li:share:7499415703171637248`;
- LinkedIn company: `urn:li:share:7499415711438721024`;
- Instagram: `18066008702588082`.

BG171 recovery execution: `2c11c1721cda4869a0143763b7421ed2`.
BG179 recovery execution: `b766d98ce0fa43d384c7f3885be833c1`.

## Current external runtime boundary
After correcting the BG156 envelope, a verification run could not start because Make reported the organization/team paused due to exceeded operations or data-transfer limits. Increasing paid resources is outside autonomous scope. BG184 configuration remains persisted, but the corrected escalation route must be re-run once the existing Make capacity is available again. This is a runtime verification boundary, not permission to treat the route as green without proof.

## Regression requirements
Future changes must preserve:
- hourly deterministic scan rather than paid AI healthy-path monitoring;
- the 10 minute grace rule;
- independent external channel IDs as completion evidence;
- explicit blocking/rejection precedence over inferred approval;
- idempotent native executors;
- exact BG156 `type` + `source` envelope;
- BG168 shared-learning writeback;
- no `success`/zero-candidate shortcut for an overdue obligation.
