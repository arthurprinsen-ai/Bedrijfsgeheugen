# Regulatory source current-main recovery — 2026-09-25

The latest raw regulatory source observations are carried onto current main through the automation recovery lane.

## Root cause
The stale source candidate was first wrapped in an unregistered writer identity. The writer verifier correctly rejected that identity.

## Prevention
Raw source observations use the automation recovery lane unless a registered writer policy explicitly covers the branch. Interpretation remains separate and must be revalidated whenever source hashes change.
