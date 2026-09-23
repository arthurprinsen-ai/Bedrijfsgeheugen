# Pricing responsive tabs and mobile isolation — 2026-09-23

## Root cause
The pricing page had two independent inline JavaScript runtimes controlling the same lifecycle, plan and billing state. Separately, the legacy mobile feature-matrix CSS used bare `table, thead, tbody, tr, th, td` selectors. That rule therefore transformed the lifecycle route matrix as well, producing broken or empty-looking mobile blocks.

## Fix
Pricing state now has one cache-busted external runtime: `/assets/pricing-interactions-v3.js?v=20260923-1`. Lifecycle tabs and panels use explicit hidden, `is-active`, ARIA state and keyboard navigation. The old table-to-card transformation is scoped to `.tabelwrap`; the lifecycle matrix has its own responsive stacked-card treatment. Route controls use two columns on smaller screens and one column on narrow phones, with 46px minimum tap targets.

## Regression prevention
`tests/brain-pricing-interactions-functional-v1.test.mjs` now verifies one external runtime, one-to-one lifecycle tabs/panels, billing behavior, scoped mobile selectors and lifecycle-specific responsive rules.

## Acceptance
Do not mark this change live or resolved until required CI is green, the PR is merged to main, Netlify production contains the merged change, and public `/prijzen` is read back for the new runtime and responsive source markers.
