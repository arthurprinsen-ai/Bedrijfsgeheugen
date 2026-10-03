# Platform live-production route contract

The canonical Platform destination is `/product`.

The production shell readback now treats this as a hard invariant rather than a label-presence check. On each live shell page it requires both desktop and mobile Platform anchors, resolves each href against the canonical Bedrijfsgeheugen origin and rejects any target whose origin or pathname differs from the canonical product route.

This closes the remaining gap between build-time correctness and deployed-production correctness.

## Browser contract robustness

The homepage Platform/Expertise browser check now activates tabs through keyboard focus + Enter rather than pointer clicks. This preserves the same user-facing toggle assertion while preventing unrelated fixed or transient overlays from intercepting Playwright pointer events and producing false delivery failures.
