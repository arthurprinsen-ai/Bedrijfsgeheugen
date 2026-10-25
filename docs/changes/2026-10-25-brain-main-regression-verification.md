# Independent full BRAIN verification on main

The existing Unified Brain Delivery requires PR-specific base/head identity. A verification-only dispatch on main failed in its planner before executing any BRAIN tests (run 40218283550, empty git rev-parse argument). A superseded migration PR run 40218550793 failed admission, and must not be revived.

Add an independent manually dispatched `BRAIN Main Regression (verification only)` workflow, restricted to main, with immutable checked-out SHA assertion, read-only token permissions, no release/deploy step, npm ci and full scripts/brain/test-all.mjs; capture output as an immutable Actions artifact. Do not equate workflow existence to a passing run. This restores independent measurement, not 376 automatic fixes, migration replay or a production release.
