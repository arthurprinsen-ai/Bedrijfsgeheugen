# Powerhouse One Loop v1

Canonical candidate: PR #1968

Purpose: make incomplete execution recoverable rather than terminal across agent/chat/GitHub/runtime boundaries, while retaining the existing Powerhouse Brain/control-plane as the only orchestration and learning authority.

This change is intentionally additive to POWERHOUSE-DELIVERY-HYGIENE-v1 and universal ingress. It does not authorize direct-main writes, gate bypass, speculative auto-merge, heuristic PR closure or parallel delivery state.
