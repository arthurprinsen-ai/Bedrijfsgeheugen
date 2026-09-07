# Change-scoped parallel release lanes

## Goal
Bedrijfsgeheugen/Powerhouse supports parallel development and independent production release. A failing or unfinished unrelated PR must not block a production-ready change.

## Contract
- Every PR is classified by `config/brain-delivery-system.json` into backend, portal, website and/or automation lanes.
- `Required test` keeps its stable required status identity, but only shared safety plus material lane suites are blocking.
- Website browser/SEO/V18 checks only block website changes.
- Portal contracts only block portal changes.
- Brain/runtime/Make contracts only block backend changes.
- Delivery/automation contracts only block automation changes.
- Shared executable control-plane changes deliberately fan out to all lanes.
- Unknown active paths fail closed.
- BG169 remains exact-SHA production authority.
- Non-overlapping movement on main keeps the tested candidate. Synchronization is required only for a real merge conflict, changed-path overlap, declared contract overlap or declared dependency conflict.

## Existing PR migration
Current product branches are preserved: no force-push, reset, mass rebase or retarget merely to adopt this model. After this governance change reaches main, existing PRs use the lane-aware workflow on their next PR event/rerun. Only a real conflict requires that specific PR to synchronize.

## Compatibility
The latest V18 megamenu heading contract and deploy-preview browser check that landed on main while this work was in progress are retained inside the website lane.

## Acceptance
- website-only => shared + website
- portal-only => shared + portal
- backend-only => shared + backend
- automation-only => shared + automation
- shared control-plane => all lanes
- current open homepage/prices/menu work remains website
- Portal Next remains portal
- mixed growth runtime/SEO may activate backend + website
