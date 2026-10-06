# Same-day social publication recovery

The operational recovery lane now runs the complete canonical content loop rather than only the final social publisher. This matters because a missing daily post can originate earlier in the chain: winner selection, media proof, provider preflight, content generation, orchestration, capability issuance or uniqueness.

Recovery can be started in two governed ways: workflow_dispatch, or a reviewed change to `ops/social-publication-recovery-request.json` on main. Both are restricted to today's date in Europe/Amsterdam.

The workflow stores sanitized evidence for the closed-loop result and channel decision state. It contains no provider-specific publication primitives. The existing canonical publisher remains the only writer, with all identity, capability, uniqueness and provider-readback controls unchanged.
