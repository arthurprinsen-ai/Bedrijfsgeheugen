---
name: powerhouse-github-acceleration-stack
description: Use when delivering Powerhouse changes through the composed GitHub acceleration stack with adaptive impact routing, one-write integration, historical regression memory, dependency propagation, bounded CI calibration and terminal proof.
---

# Powerhouse GitHub Acceleration Stack

Fingerprint: `github|acceleration-stack|adaptive-one-write-memory-graph|v1`.

## Purpose

Treat GitHub delivery acceleration as one governed control plane rather than separate optimizations. The stack must minimize time-to-terminal-proof and runner waste without weakening safety evidence.

## Canonical composition

- Adaptive Delivery Engine v1: R0–R4 risk and capability/test impact routing.
- Integration Bundle Compiler v1: deterministic one-write bundle and exactly-one terminal writer intent.
- Delivery Pattern Memory v1: reuse canonical Brain learning as historical regression routing.
- Delivery Dependency Graph v1: propagate shared-root impact monotonically.
- CI Calibration Engine v1: read-only telemetry-to-recommendation layer.
- Autonomous CI Optimizer v1: bounded protected tuning using calibration only as advisory evidence.

## Mandatory contract

1. Classify candidate risk and impacted capabilities before expensive CI.
2. Compile one deterministic integration bundle for the exact candidate.
3. Reuse relevant proven historical regressions; never create a second learning store.
4. Dependency propagation may only add evidence or raise risk.
5. Documentation-only proof sync may use the fast impact gate only when executable/runtime impact is absent.
6. Required, CodeQL/security, protected merge, exact-current-main and production/provider readback remain mandatory whenever applicable.
7. After terminal proof, project the learning to this skill, Brain learning, component registry/System Map source and the development ledger.
8. Never report LIVE before canonical terminal evidence exists.

## Registry keys

- `CAPABILITY_ADAPTIVE_DELIVERY`
- `CAPABILITY_INTEGRATION_BUNDLE_COMPILER`
- `CAPABILITY_DELIVERY_PATTERN_MEMORY`
- `CAPABILITY_DELIVERY_DEPENDENCY_GRAPH`
- `CAPABILITY_CI_CALIBRATION_ENGINE`
- `CAPABILITY_AUTONOMOUS_CI_OPTIMIZER`
- `CAPABILITY_GITHUB_ACCELERATION_STACK`

## Proven source lineages

#3222, #3236, #3242, #3244, #3247 and #3256 establish the component capabilities and their terminal proof. This skill is the canonical composition/projection of those proven lineages.

## Watchdog API-foutisolatie (22 oktober 2026)

Fingerprint: `delivery|required-watchdog|transient-api-abort-all-prs|20261022-v1`.
De bestaande vijfminuten-watchdog blijft enige eigenaar van Required-/CodeQL-observaties. Begrens elke GitHub GET op 8 seconden en maximaal twee pogingen alleen bij 429, 5xx of netwerk/timeout. 403 en 404 blijven fail-closed. Retry nooit een POST/comment/dispatch op ambigu resultaat: lees de bestaande marker bij de volgende tick terug. Een fout in één PR mag de overige PR's niet overslaan; verwerk maximaal drie PR-fouten per tick en laat de workflow rood met onveranderde provider-evidence. Geen tweede cron of writer, geen verzwakte security-/CLS-gate en nooit LIVE_PROVEN zonder onafhankelijke readback.
