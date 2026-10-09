# P0 #4198 — Predictive signal write stabilization and retirement of Groq fallbacks

The existing production predictive Edge function v181 had a genuine HTTP 500 with Postgres 57014 statement timeout at 2026-10-09T14:28:11Z. Its source unconditionally upserted all collected signal rows, which invoke an AFTER INSERT/UPDATE forecast sync trigger, itself provoking calibration-obligation updates. This is a plausible avoidable load mechanism; the precise timed-out statement was not independently isolated.

This candidate keeps the governed Anthropic-only path, approved model, exact scheduler token, forecast scoring, immutable evidence fields and original one-executor design. It compares existing signal rows against the current source and issues upserts *only for new or materially changed* signals in batches of 8. It exposes actual written signal count in the existing health receipt and response. Do not claim the production timeout fixed until the patched exact release has a successful authorized end-to-end prediction readback.

The two previously ACTIVE Groq-only governance fallback records for content and forecast calibration were independently changed to SUSPENDED directly in the existing production registry and reread, without turning off either Anthropic primary. Migration repeats the same guarded changes with idempotent SQL for GitHub parity. Other use cases remain untouched. Existing content-generation and calibrator Edge versions already call Anthropic as primary.

The commercial daily output for Oct 9 has 5 provider-inbox-verified SalesRobot LinkedIn messages and 1 independently proven blog, which is not the same as reply, conversion, meeting or realized revenue. The overall daily run remains degraded and P0 #4198 open. No synthetic observations, bypasses, duplicate posts/DMs or parallel schedulers.

After protected CI and merge, deploy exact existing Edge function source and verify (1) scheduler-authorized Anthropic response, (2) persisted forecast provider/model and source linkage, (3) no timeout, (4) source/production hash parity, and separately (5) external reply/order event-to-delivery-to-Brain provenance.
