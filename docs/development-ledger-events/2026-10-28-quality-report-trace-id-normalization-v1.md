# Canonical improvement ledger — trace-ID lost in event normalization
Date: 2026-10-28
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547

- Observed: quality report row "Agents & tracekwaliteit" could never leave NIET GEMETEN because the normalizer dropped the trace field.
- Root cause: field read by the report was never produced by the projection; no test spanned record to report.
- Containment: keep explicit traceId/trace_id only; correlationId is never a trace; wording stays at TRACE WAARGENOMEN without a grade.
- Regression: end-to-end test from projection to report, verified failing without the fix; full portal-v2 suite 651/651 green.
- Status note: the earlier record 2026-10-23-portal-agent-intelligence-evidence-analytics-v1.json still says not live; #4747, #4761 and #4777 are on main since 2026-10-23. Production readback remains unverified.
- Independent business uplift: NOT MEASURED. No second agent/scheduler, database write or new costs.
