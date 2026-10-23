# Commercial action closure — 2026-10-05

Powerhouse may never present research, preparation, scheduler activity, a merged blog, or a provider dispatch attempt as commercial execution.

Runtime invariant:
- stale internal `research_enrichment` closes as evidence-backed `OBSERVE` / expired;
- external actions remain owned as `WAIT` until their canonical executor records provider proof or an explicit terminal decision;
- provider execution remains with the existing channel executors, preserving dedupe, consent, pressure and identity gates;
- the lifecycle watchdog runs every 10 minutes and creates no parallel queue or CRM.

Initial production reconciliation: 570 stale research actions terminalized; 325 overdue external actions retained as owned WAIT; zero overdue research actions remained after readback.
