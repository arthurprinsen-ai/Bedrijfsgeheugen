# Development ledger — bounded model context and missing Anthropic tool output

- Date: 2026-10-09; canonical original scheduler, governed Anthropic `claude-sonnet-5`, existing single Edge function, no new executor.
- Real evidence: protected #4274 then #4276 merged, Edge v182/v183 deployed with exact source parity.
- Real authenticated v183 request 1712: outer transport 120000ms timed out; health subsequently wrote `AI_TOOL_OUTPUT_MISSING` at 15:35:54 UTC; no valid new forecast result.
- Root cause hypothesis to test: oversized model request and/or output budget; do not assert `stop_reason=max_tokens` without provider evidence.
- Change: at most 40 public signals with source diversity, summary excerpt cap, 12 prior forecasts and learnings, up to 4 schema-bound new forecasts, 6000 max output tokens. Continue using original approved model, strict evidence membership and threshold checks, bounded DB writes, scheduler authorization.
- Observability: error now records provider `stop_reason`, type list and actual output token count, never raw provider API key or private contacts.
- Regression: tests/brain-predictive-bounded-tool-context-v1.test.mjs, existing predictor tests.
- Do not close P0 until a real forecast, all external publications, prospect outcomes and Brain learning succeed and are independently read back.
