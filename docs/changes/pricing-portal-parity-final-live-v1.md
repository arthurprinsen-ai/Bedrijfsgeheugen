# Pricing ↔ Portal parity exact-production promotion v1

Date: 2026-09-25

## Incident
Pricing and Portal parity, including the multi-context route calculator and the incremental static-English cache repair, were on main while Netlify production still served an older commit.

## Root cause
The canonical Production Source Snapshot is intentionally path-gated to its own workflow file. Moving main alone therefore does not prove that the current exact source has been promoted.

## Fix
This lineage triggers the canonical Production Source Snapshot for the current exact source.

## Terminal proof
Do not call this LIVE until the merged current main SHA is identical to the ready Netlify production commit and the production pricing/readback checks are green.
