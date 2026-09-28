# Adaptive Delivery specificity v1 — activity ledger

Date: 2026-09-28
Obligation: adaptive-delivery-specificity-v1

Observed:
- docs-only closure PR #3234 was safely over-classified and therefore executed the heavy shared suite.

Root cause:
- declaration-order matching selected broad `brain/` before specific `brain/learning/`.

Implemented:
- most-specific-path risk selection;
- regression for nested R0 learning;
- regression proving specific production workflow remains R4;
- Brain learning + skill prevention.

Expected outcome:
- low-risk docs/learning changes can actually use the fast-impact route;
- critical paths retain fail-closed escalation.
