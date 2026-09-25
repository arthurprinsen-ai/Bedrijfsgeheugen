# Main push fan-out governor v4 — 25 september 2026

## Why v4 exists
The preceding successor became dirty because protected main advanced while the branch was waiting. It was not force-merged. This recovery is rebuilt from current main and reapplies only the proven contract corrections.

## Closure
- main-push scope regression supports valid multiline YAML branch lists;
- browser-gate-boundedness is registered in the canonical System Map;
- pricing rescue tests assert the content-addressed runtime key rather than the obsolete timestamp key;
- production pricing readiness is asserted through the actual dataset ready-v3 contract.

## Prevention
Never force a dirty recovery branch over a newer main. Rebuild from current main, replay the narrow proven delta, then rerun exact-head gates.

Protected merge and current-main readback remain terminal authorities.
