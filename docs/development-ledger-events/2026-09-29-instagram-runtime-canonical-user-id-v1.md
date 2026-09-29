# 2026-09-29 — Instagram runtime canonical identity

Root cause: stale hardcoded Instagram business user id after Composio canonical account rotation.

Fix: runtime identity via `me`, username verification, provider user id propagation, fail-closed mismatch handling.
