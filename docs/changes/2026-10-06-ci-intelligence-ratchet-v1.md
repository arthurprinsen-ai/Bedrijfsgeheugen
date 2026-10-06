# CI Intelligence ratchet — 2026-10-06

The CI optimizer now distinguishes the canonical Required fastlane from generic job latency. Daily telemetry records Required queue p95, Required total p95, workflow fan-out, active nonterminal runs and the number of unscoped pull-request workflows.

The topology budget is monotone: observed improvement can lower the configured budget, but the optimizer cannot raise it. The structural target is two unscoped PR authorities: Required and CodeQL.

The optimizer itself is schedule/manual only. Any proposed tuning still goes through a protected PR and cannot weaken release, security, exact-SHA or production-readback safety.
