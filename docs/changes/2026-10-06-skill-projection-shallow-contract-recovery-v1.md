# Skill projection shallow-checkout contract recovery — 2026-10-06

PR #3947 intentionally bounded Powerhouse Skill Projection checkout history to `fetch-depth: 2`. The post-merge canonicalization regression still asserted the retired `fetch-depth: 0` behavior, so Skill Projection failed after a fully green protected merge.

This recovery changes only the contract expectation. The test now requires depth 2 and explicitly rejects depth 0. No runtime, provider, release, security, or projection semantics are weakened.
