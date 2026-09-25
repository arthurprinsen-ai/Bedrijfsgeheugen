# Production readback safe supersession

**Date:** 2026-09-25  
**Fingerprint:** `delivery|production-readback-safe-supersession|v1`

A live readback for runtime merge `7fb8e80d…` failed after production advanced to descendant `582e58d7…`. The diff between those SHAs contained only skills, Brain learning, documentation and tests.

The permanent rule accepts either the exact triggering SHA or a newer Git descendant only when every intervening path is explicitly non-production-affecting. Runtime-affecting paths, non-descendants and unknown paths remain fail-closed.

This rule is shared by Production Source Snapshot, Production Release Readback and Canonical brand shell live readback.
