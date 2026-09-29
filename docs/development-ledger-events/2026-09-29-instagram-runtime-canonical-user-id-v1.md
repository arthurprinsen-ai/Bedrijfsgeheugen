# 2026-09-29 — Instagram runtime canonical identity

Root cause: stale hardcoded Instagram business user id after canonical Composio account rotation/drift.

Fix: runtime identity via `me`, canonical username verification, provider user id propagation, fail-closed mismatch handling, regression tests, skill/agent inheritance.
