# Netlify linked-build error fallback — 25 September 2026

## Incident
The production deployment bridge authenticated successfully and `trigger_build` returned `ok=true`, but Netlify's linked repository build returned `state=error` with build exit code 2.

The workflow already had an authorized exact-source upload fallback, but only used it when Netlify returned `error_message=Skipped`. A normal linked build error therefore stopped delivery prematurely.

## Fix
A linked deploy/build error is now logged and then routed to the existing canonical exact-source upload fallback. The fallback remains bounded and authenticated through the same OIDC/Netlify transport.

## Safety invariants
This is not a bypass. Delivery is still fail-closed unless all of the following prove green:
- Netlify provider deploy reaches ready;
- production `release.json` exposes the exact expected SHA and production context;
- pricing production-content contract passes;
- production browser verification for pricing toggles and NL/EN passes.

Regression: `tests/brain-netlify-linked-build-error-fallback-v2.test.mjs`.

## Closure learning
The first prevention regression itself contained an invalid multiline regex literal. This was caught fail-closed by both BRAIN backend and Skill Projection. The regression now uses explicit fragment assertions, and the durable rule is that every historical-replay regression must parse and execute before learning projection.
