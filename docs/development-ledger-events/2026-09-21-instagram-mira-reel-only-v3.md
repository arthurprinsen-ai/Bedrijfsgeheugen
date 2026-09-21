# 2026-09-21 - Instagram Mira Reel only v3

- Incident: static Instagram feed posts were published while the intended daily contract required a Mira video/Reel.
- Root cause: policy v2 still explicitly allowed image and a parallel execution route bypassed canonical Reel-only semantics.
- Fix: remove image from allow-list; require reel in JS gate, database media-job validation and publication-capability issuance; move publisher policy to v3; update tests and skill.
- Prevention: No Mira or not a Reel means no Instagram provider mutation; provider outage means recoverable blocker, never image fallback.
- Delivery state: candidate until protected merge, deployment and production readback.
