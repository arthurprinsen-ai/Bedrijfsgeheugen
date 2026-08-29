# BG184 — Social Outcome Obligation Guardian

## Identity
- Make scenario: `7147086`
- Name: `BG 184 - Social Outcome Obligation Guardian v1`
- Schedule: every `3600` seconds.
- Central media calendar data source: `626e4c3c-cfee-4390-b519-6a910538607d`.

## Purpose
BG184 is the social reference adapter for the whole-brain outcome-obligation contract. It does not ask only whether a publishing workflow ran; it verifies whether each due channel outcome actually exists.

A technically successful social window with a **zero-candidate** result is **RED** once a scheduled channel obligation is overdue beyond the bounded grace period.

## Due semantics and evidence
BG184 follows the same channel-time rules as the native publishers and applies a 10 minute grace period. It checks only non-test records.

Independent channel outcome evidence is:
- personal LinkedIn: non-empty `Post ID LinkedIn`;
- LinkedIn company: non-empty `Bedrijfspaginapost`;
- Instagram: non-empty `Post ID Instagram` plus native verification/status when available.

A Make success status is not completion evidence without those channel outcomes.

## Safe deterministic repair
BG184 may repair only a stale release-state gap when substantive automated QA is already green. Explicit rejection or blocking is never overridden. Recovery must be idempotent and must check existing external IDs before any side effect.

Existing native executors remain authoritative:
- BG171 LinkedIn executor: `7140072`;
- BG179 Instagram executor: `7140394`.

## Governed escalation
When an obligation is due but deterministic repair is unsafe or insufficient, BG184:
1. writes the material error through BG168 `7136176`;
2. dispatches GREEN-UNTIL-DONE recovery to BG156 `7132258`;
3. keeps the obligation RED until independent outcome evidence appears.

The BG156 event envelope must contain top-level `type` and `source`. Earlier use of `event_type` produced `INVALID_EVENT_ENVELOPE`; the corrected contract is `type="ERROR"`, `source="BG184"`, with supporting evidence nested under `evidence`.

## Verified reference recovery
For the 2026-08-29 missed social obligation, external outcomes were independently verified after deterministic state repair and native executor runs:
- LinkedIn personal: `urn:li:share:7499415703171637248`;
- LinkedIn company: `urn:li:share:7499415711438721024`;
- Instagram: `18066008702588082`.

Relevant recovery executions were BG171 `2c11c1721cda4869a0143763b7421ed2` and BG179 `b766d98ce0fa43d384c7f3885be833c1`.

## Current external runtime boundary
Live re-verification of the corrected BG184 → BG156 escalation is not currently available through the connected Make surface: the account connection returns `400 — We couldn't connect your account`, and prior runtime evidence records a usage/capacity pause. Changing credentials, permissions or increasing paid resources is outside autonomous scope. This route remains `BLOCKED_HARD_BOUNDARY`, not green, until live evidence exists.

## Regression requirements
Future changes must preserve hourly deterministic scanning, bounded grace, external platform IDs as completion evidence, explicit block/rejection precedence, idempotent execution, exact BG156 `type` + `source`, BG168 shared-learning writeback, and the rule that overdue zero-candidate success is RED.
