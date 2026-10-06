# Scope control-plane brain scripts to their owning lane

A small chat-learning regression change activated all four delivery lanes because `scripts/brain/` was configured both as a shared executable prefix and as a backend lane prefix.

The shared fallback is removed for `scripts/brain/`. Generic brain scripts remain backend-owned through the existing backend lane. Exact control-plane scripts with explicit ownership keep that narrower owner, so autonomous-engineering scripts remain automation-only.

This removes unnecessary portal and website/browser work without weakening Required, CodeQL, exact-HEAD identity, or production readback.
