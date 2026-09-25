# Attainable Brain evidence for terminal closure

Date: 2026-09-25  
Fingerprint: `delivery|terminal-gate|trigger-aware-impossible-event|v1`

## Incident

Obligation Terminal Closure run `36175492847` remained in the exact-head critical-gate step after Required, Powerhouse Skill Projection and Powerhouse CodeQL were green.

The terminalizer depended on exact-head Unified Brain evidence, but that evidence path was not present for the merged candidate.

## Repair

The terminalizer now uses a strict evidence hierarchy:

1. if an exact-head Unified Brain run exists, it must complete successfully;
2. otherwise, Brain foundation verification on the merge SHA must complete successfully;
3. failed or non-terminal evidence on either applicable path blocks terminal closure.

This prevents impossible-event waiting without synthesizing a green gate or weakening closure semantics.
