# Global Execution Obligation Sentinel — Contract

## Purpose
The global sentinel detects silent runtime omissions across production-critical Make scenarios without confusing runtime execution with business outcome verification. It complements the domain adapters defined by `docs/outcome-obligations.md`.

## Deterministic healthy path
The sensor is deterministic and bounded. A healthy scan performs **no paid AI** recovery chain. It reads only the minimum scenario/runtime state needed to answer whether an execution obligation is currently RED.

## Execution obligations
For each registered production-critical scenario, the sentinel evaluates:
- expected `schedule` or trigger state;
- active versus unexpectedly inactive/invalid configuration;
- bounded `last execution` recency against the scenario's expected cadence and grace;
- latest error/warning state;
- any explicitly declared `required output` or completion marker;
- known open recovery fingerprint and next safe action.

A scenario that should have run but has no suitably recent execution is RED. A scenario that ran but omitted a declared required output is also RED.

## Routing
- Runtime continuity faults such as unexpectedly inactive/invalid scenarios route first to **BG165** for safe restart/configuration recovery.
- Missing or unverifiable business outcomes route through **BG168** shared learning and to **BG156** governed GREEN-UNTIL-DONE recovery when deterministic repair is not safe.
- Known fingerprints reuse BG166/BG167 learning before new hypotheses are explored.

## Outcome boundary
A **successful Make execution is not a business outcome**. The global sentinel can prove that an execution happened; only the relevant **domain adapter** may prove that the intended business result happened. Examples are social external post IDs, a public blog URL, data freshness evidence, CRM outcome evidence or exact GitHub/Netlify deployment identity.

## Registration contract
A production-critical Make flow is fully covered only when its registration declares:
- scenario identity;
- expected cadence/trigger;
- grace window;
- expected execution evidence;
- required output when applicable;
- owning domain adapter for real outcome verification;
- idempotency/retry semantics;
- BG165/BG156 recovery route;
- stable fingerprint prefix.

## Retry and cost rules
The sentinel does not poll indefinitely and does not invoke BG156 for healthy scenarios. Identical retries remain capped at two per hypothesis. Duplicate incidents are coalesced by fingerprint so one outage does not trigger parallel paid recovery chains.

## Hard boundaries
If the only remaining recovery requires secrets/credentials/permissions, weakened security, destructive data mutation, more paid resources or a legal/financial action, the sentinel records the RED obligation and `next_safe_action` and reports `BLOCKED_HARD_BOUNDARY` only after all safe work is exhausted.

## Domain-adapter relationship
The sentinel is a platform-wide runtime safety net, not a replacement for domain outcome adapters. Every new production-critical domain must still implement its own independent verifier under the universal obligation contract.
