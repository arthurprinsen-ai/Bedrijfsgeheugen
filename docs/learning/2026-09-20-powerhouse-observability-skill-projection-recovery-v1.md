# Recovery — Powerhouse Control Center skill projection

The Powerhouse Control Center implementation itself merged in PR #2445, but its learning-to-skill projection was not terminal green at merge time.

The cause was a noncanonical regression-test path in the learning metadata. The functional dashboard code does not need to be rebuilt; the correct recovery is to preserve the implementation and repair only the learning/test contract.

This recovery moves the test into the canonical Brain test namespace and re-runs the same obligation through the normal protected delivery chain.

Definition of done remains: implementation on main + regression green + skill projection green + production/readback evidence.
