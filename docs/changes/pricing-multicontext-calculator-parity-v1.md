# Pricing multi-context calculator parity v1

## Root cause
The pricing page correctly stated that Powerhouse supports one primary business phase plus multiple simultaneous strategic events and entrepreneur goals, but the route calculator still used single-select controls for event and goal.

## Fix
The calculator now mirrors Portal V2 semantics:
- one primary business phase;
- zero or more strategic events;
- zero or more entrepreneur goals;
- recommendation logic reads all selected overlays;
- the recommendation breakdown shows all selected overlays;
- lifecycle commercial tabs can add a relevant event without erasing other context.

## Prevention
Any public pricing/context selector must preserve the same cardinality as the canonical Powerhouse business-context engine. A regression test fails if strategic events or goals fall back to single-select semantics.
