# Daily social self-healing — 2026-09-27

## Incident
Daily LinkedIn delivery could miss even while a healthy Composio connection existed. Personal LinkedIn could also block on `PERSONAL_TRUTH_SOURCE_UNVERIFIED` after the unused verified source pool was exhausted.

## Structural fix
The existing five-minute closed loop remains the only scheduler. LinkedIn setup now probes all ACTIVE Composio connections and selects one only when provider readback proves the canonical member `urn:li:person:N1twnCNCrD`; revoked siblings are ignored. The publisher independently re-probes candidates if setup state is stale.

Personal LinkedIn keeps the truth gate. When no unused verified source remains, a second-stage fallback selects the least-recently-used verified non-sensitive source and requires a completely new angle and wording. Verbatim reuse, invented facts, business bridges and management morals remain forbidden.

## Delivery semantics
A successful provider create returning a LinkedIn URN is a side effect and makes the daily claim republish-forbidden. Missing readback permission is reconciled against that exact URN rather than causing a replacement post. Buffer is not a LinkedIn recovery path.

## Scheduler
`powerhouse-content-closed-loop-v1` runs every five minutes and now prepares both ordinary fallbacks and rotating verified personal fallback before orchestration/publishing.
