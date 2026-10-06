# Restore versioned delivery metadata authority — 2026-10-06

## Problem

PR #3986 was intended to make material-writeback diffing shallow-safe, but it also changed `tools/delivery/delivery-metadata-authority.mjs`. That collateral change made a complete mutable PR body authoritative even when a valid versioned exact-head manifest existed for the same obligation.

## Structural fix

The original Powerhouse One Loop rule is restored: when PR metadata and a valid `POWERHOUSE-DELIVERY-CANDIDATE-v1` manifest refer to the same `Obligation-ID`, the versioned manifest is authoritative. PR-body metadata remains the fallback when no manifest exists or the manifest belongs to another obligation.

The existing regression `tests/powerhouse-one-loop-versioned-metadata-authority.test.mjs` continues to enforce this contract.
