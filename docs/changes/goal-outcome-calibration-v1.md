# Goal outcome calibration loop

The Goal Cockpit now closes the loop from scenario assumption to measured business outcome.

## Behavior
- reads goal/lever outcomes from canonical Portal/runtime outcome state;
- compares expected effect with realized effect;
- requires at least 3 verified quantified outcomes for a lever before a historical calibration factor becomes available;
- leaves the entrepreneur-entered scenario assumption unchanged;
- exposes a separate evidence-adjusted effect and scenario endpoint when calibration is available;
- shows expected versus realized outcomes in the Business Context cockpit;
- routes the user to Outcomes & evidence for measurement and verification.

## Truth contract
A scenario assumption is never silently rewritten into fact. Historical calibration is only projected after at least three verified outcomes for the same goal/lever combination. Calibration is bounded to avoid extreme overreaction and remains traceable to measured outcomes.
