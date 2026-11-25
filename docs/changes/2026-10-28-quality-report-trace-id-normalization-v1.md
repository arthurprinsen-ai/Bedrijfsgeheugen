# Quality report — trace-ID no longer lost in event normalization
Date: 2026-10-28
Existing owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
Related: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4761

## Source finding
The Agent Intelligence quality report (Powerhouse Control Center, tab Leerintelligentie) counts events that carry a `traceId`. The only normalizer that feeds it, `normalizeObservabilityRecord` in `portal-v2/runtime-evidence.js`, did not copy any trace field. The row "Agents & tracekwaliteit" therefore always read NIET GEMETEN, regardless of the data. Missing coverage was reported, but the cause was in the projection, not in the data.

## Contained correction
The normalizer now keeps an explicit `traceId` or `trace_id` (trimmed). `correlationId` is a loop identifier and is deliberately not promoted. The report wording is unchanged: an observed trace is not a trace grade and not evidence of model quality.

## Acceptance
The same end-to-end regression exists twice: in `tests/brain-agent-intelligence-analytics.test.mjs` (the canonical learning evaluation only accepts `tests/brain-*.test.mjs`) and in `portal-v2/tests/runtime-evidence-wiring.test.mjs` (portal suite). Both follow a record from the projection through the normalizer into `deriveQualityReport` and fail without the fix. No new endpoint, scheduler, writer, database change or source authority.

## Still open
Whether the server records actually carry trace IDs in production is not verified here. After merge, an authenticated owner readback of the tab must show whether the row moves from NIET GEMETEN to TRACE WAARGENOMEN. Until then no quality claim follows from this change.
