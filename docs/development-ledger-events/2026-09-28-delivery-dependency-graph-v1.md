# Delivery Dependency Graph v1 — activity ledger

Date: 2026-09-28
Obligation: delivery-dependency-graph-v1

Implemented:
- versioned dependencyGraph in adaptive delivery policy;
- risk-floor propagation;
- downstream capability propagation;
- named regression propagation;
- explainable dependencyMatches;
- regressions for Required root, package manifest and Supabase authority;
- skill + component registry projection;
- Pattern Memory learning promoted to PROVEN from current-main containment.

Expected effect:
- cross-cutting control-plane changes get precise downstream coverage;
- fewer ad-hoc hot-file rules;
- better explainability without weakening any terminal gates.
