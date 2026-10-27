# Live PR metadata authority regression contract

The delivery metadata runtime already uses complete live PR metadata as the source of truth when a stale versioned manifest exists for the same obligation.

The regression suite is aligned to that rule:

- complete live PR metadata wins;
- incomplete PR metadata falls back to a validated exact-head manifest;
- a manifest for another obligation never takes authority.

This removes a stale test oracle without weakening fail-closed fallback behavior.
