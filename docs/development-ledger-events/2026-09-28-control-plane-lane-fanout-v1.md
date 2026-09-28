# Control-plane lane fan-out prevention — activity ledger

Date: 2026-09-28
Obligation: control-plane-lane-fanout-v1
Trigger evidence: optimizer PR #3251 selected all runtime lanes although no website/portal runtime changed.

Implemented:
- component registry classified governance-only;
- explicit owned-lane map for autonomous optimizer/tuning paths;
- explicit backend map for CI intelligence/calibration paths;
- regression proving optimizer governance bundles select backend + automation only;
- unknown/shared runtime behavior remains fail-closed.

Expected effect:
- daily autonomous tuning PRs no longer pay Netlify/browser cost;
- CI calibration changes avoid portal/website fan-out;
- runtime coverage remains unchanged when real runtime paths change.
