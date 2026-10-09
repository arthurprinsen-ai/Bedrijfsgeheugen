# P0 #4198 — bound provider context to recover missing Anthropic tool output

Real production predictive-engine v183 request 1714 returned HTTP 500 `AI_TOOL_OUTPUT_MISSING`. This is not proof of a new forecast. Root cause remains partly unknown because previous error excluded the Anthropic `stop_reason` and block types.

The existing Edge sends a bounded, evidence-key-preserving context of at most 50 ranked source signals, trims factual evidence, and requests 1-3 forecasts via the same required `forecast_plan` tool. It keeps the approved Anthropic model, scheduler auth, unchanged-signal dedupe, 5-row trigger-safe batches, source evidence validation and 90s finite deadline. It records only safe provider diagnostic metadata for missing tool output, never prompt content or credentials.

This change is not production-proven until protected CI/CodeQL/preview, exact main→Edge parity, real authorized full forecast with persisted Anthropic attribution and predictive health readback. The commercial day and realized revenue require separate provider outcome evidence.
