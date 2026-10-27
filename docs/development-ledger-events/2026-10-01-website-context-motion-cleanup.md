# Website context & motion cleanup — 2026-10-01

## Trigger
Live screenshots showed repeated “Gerelateerde oplossing” cards, empty-looking governance cards, large unused whitespace and “interactive” examples that only changed after a click. The product page also showed a standalone Powerhouse proposition directly above the existing platform hero, creating a duplicate hierarchy.

## Recovery
- Powerhouse Intelligence, Agents and Connect are embedded inside the existing product hero.
- The separate proposition hero is removed and the finalizer now removes legacy injected copies.
- Product mock, portal demo and Modelwijzer Powerhouse flow autoplay in a bounded loop while preserving manual interaction and reduced-motion accessibility.
- AI Modelwijzer governance classes are namespaced to avoid global CSS collisions.
- SEO revenue handoffs are deduplicated into one contextual “Verder in Powerhouse” block.
- Empty dynamic shells and duplicate handoff blocks receive global presentation guards.
- Regression tests, website/portal skill and System Map invariants were updated.

## Acceptance
One primary hero, no empty cards, no large blank dynamic surfaces, one contextual commercial handoff, and self-playing interaction that demonstrates how Bedrijfsgeheugen/Powerhouse works.

## Portal routing drift found during verification
The full portal suite exposed five existing contract failures: Data & AI missed runtime/Brain routes, Actions missed recovery/monitoring routes, desktop navigation did not consume the canonical explicit item model, and the full menu was derived from a reduced desktop grouping instead of the complete page registry. The recovery keeps one portal shell and restores these routes in the existing hubs.

- Successor metadata normalized on current main; obsolete PR #3537 is closed and not part of the executable lineage.
