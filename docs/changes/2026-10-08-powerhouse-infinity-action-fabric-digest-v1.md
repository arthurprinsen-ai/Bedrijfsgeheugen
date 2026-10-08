# POWERHOUSE ∞ Action Fabric digest repair

The live integrated cycle exposed a production-only Action Fabric failure: the security-definer materializer could not resolve `digest(bytea, unknown)` because pgcrypto is installed in `extensions` and the function search path is restricted.

This repair qualifies `extensions.digest`, requires a non-empty canonical action reference before Action Fabric can be operational, and runs the new regression in the canonical Whole Brain workflow. Production closure requires a protected merge, migration readback, a MATERIALIZED action and a new seven-component VERIFIED receipt.
