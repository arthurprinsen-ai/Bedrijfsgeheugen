# Live pricing contract fixture parity

Root cause: the positive live-contract fixture represented the old pricing proposition. Once production readback required the canonical Build package and value/payback proof, the fixture failed before it could validate live production.

Prevention: changes to immutable pricing production truth must update both the live assertions and their positive fixture in the same lineage. Legacy Transform and annual-toggle copy remain forbidden.

Evidence: `tools/site-shell/test-live-contract.mjs` now models the canonical Build/value proposition and is exercised by the canonical live shell gate.
