# GitHub hygiene and terminal cost control v1

## Why

Parallel delivery recovery could create bursts of terminal-closure workflows while repository hygiene only audited stale generated work. That combination increased queue pressure, Actions minutes, repeated API calls and the chance that stale branches or candidates remained visible as active work.

## What changed

Terminal recovery is globally serialized: when any terminal closure is already queued or running, the recovery supervisor does not dispatch another one. When none is active, it dispatches at most one missing terminal closure per supervisor cycle.

Per-PR terminal closure remains non-cancelling. A real failed production readback remains fail-closed; descendant live proof is only a recovery path for missing or cancelled canonical readback. This keeps evidence quality intact while avoiding duplicate recovery amplification.

Scheduled repository hygiene now runs in apply mode. Existing safeguards remain authoritative: open PR heads, protected namespaces, archive/backup state and branches with unique commits are retained. Cleanup work is resource-budgeted so one run cannot fan out into unbounded GitHub API or Actions load.

## Cost and sustainability effect

The control plane reduces duplicate runner execution, repeated network/API traffic and unnecessary artifacts. That lowers GitHub Actions consumption and avoidable infrastructure energy use. Water and CO2 effects are treated as resource-efficiency goals rather than directly measured claims unless provider telemetry is available.

## Operating invariant

Parallel work may increase throughput, but it may not create multiple canonical writers for the same terminal obligation or allow cleanup work to outrun its safety budget.
