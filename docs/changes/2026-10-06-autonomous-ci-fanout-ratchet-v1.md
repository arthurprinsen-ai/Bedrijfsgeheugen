# Autonomous CI fan-out ratchet — 2026-10-06

The CI optimizer and daily self-evolution are background control-plane jobs, not independent PR gates. Their pull-request triggers are removed and their safety/contract tests are centralized under Required.

CI Intelligence now measures Required queue p95, Required total p95 and the number of direct pull-request workflow ingress points. The daily optimizer keeps a monotone budget: when the measured count falls, the budget ratchets down; if the count later grows, autonomous tuning refuses to raise the budget.

Release, security, protected-merge, exact-SHA and production-readback safety flags remain immutable.
