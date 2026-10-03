# Platform live-production route contract

The canonical Platform destination is `/product`.

The production shell readback now treats this as a hard invariant rather than a label-presence check. On each live shell page it requires both desktop and mobile Platform anchors, resolves each href against the canonical Bedrijfsgeheugen origin and rejects any target whose origin or pathname differs from the canonical product route.

This closes the remaining gap between build-time correctness and deployed-production correctness.
