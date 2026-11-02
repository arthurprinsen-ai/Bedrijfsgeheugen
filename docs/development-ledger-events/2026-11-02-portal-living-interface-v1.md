# 2026-11-02 — Living Business Interface V1 foundation
Parent issue: #4547. Branch: `feat/portal-living-interface-ux-foundation-20261102`. Baseline SHA: `68146ba41b92e19b8e841cad049d7222f783da8d`.
Scope: additive CSS and interaction enhancement of canonical Portal V2; five chart functions expose exact source-derived values through keyboard/touch-native disclosure tables; form primitives expose linked help/errors and block invalid native values from invoking `onChange`.

**Failure mode addressed:** chart marks could be beautiful but lacked complete nonvisual table equivalents, and generated fields did not link their help/errors via `aria-describedby`; invalid input still propagated via handlers. Existing InsightLens, Brain, tenant authorization and runtime actions are preserved.

**No false green:** this is a code candidate. This change does not prove 100% route coverage, real business value, WCAG conformance, user award eligibility, production deploy or authenticated customer readback. Validate via the focused `portal-v2/tests/living-interface.test.mjs`, full protected suites, visual/keyboard/zoom/mobile baselines and two genuine tenants. Source-of-truth statuses remain unchanged. Only original protected release owner may merge/deploy; rollback by reverting the commit.

**Required follow-up:** measured entrepreneur usability (8+ users), complete component inventory, all page routes, admin/source evidence and visual snapshots; retain deficits in #4547 and ONE BRAIN under original incident workflow.
