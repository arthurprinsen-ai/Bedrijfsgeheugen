# Goal scenario evidence and execution loop

The Goal Cockpit now closes the loop from a what-if lever to evidence and execution.

## Behavior
- quantified effects are classified as supporting the goal, neutral, or moving away from it;
- only goal-supporting quantified effects can become ranked next-best actions;
- scenario assumptions can carry source/evidence references directly from the cockpit;
- a next-best lever can be added to the canonical roadmap in one action;
- the roadmap item retains goal id, lever id, target, target date, expected effect, unit, evidence mode, and source references;
- duplicate goal/lever roadmap items are rejected rather than silently duplicated.

## Truth boundary
A scenario effect remains an assumption unless evidence references are attached. Adding it to the roadmap does not convert the assumption into a fact. Real outcome evidence must still be measured after execution before Powerhouse may learn from the result.
