# Powerhouse Problem Library version contract — 24 september 2026

## Incident

PR #2796 expanded the canonical Problem Library to version `1.1.0` and 40 problems, but the baseline contract test still expected `1.0.0` and at least 30 problems.

## Fix

The baseline contract now asserts version `1.1.0` and at least 40 canonical problems.

## Prevention

A taxonomy version or canonical-count change must update the baseline library contract in the same candidate. A merge is not terminal proof when the post-merge main regression is red.
