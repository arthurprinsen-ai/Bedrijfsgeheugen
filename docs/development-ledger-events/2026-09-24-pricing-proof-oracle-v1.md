# 2026-09-24 — pricing production proof oracle correction

The new production interaction-proof pipeline correctly failed closed, but the failure occurred before browser verification because the preceding content proof still depended on two stale literal-copy assertions: `<h3>Build</h3>` and an older ROI sentence.

This is a proof-oracle defect, not a product regression. Literal marketing copy and presentation headings are not stable functional contracts.

Correction:
- remove stale copy-level assertions from the production content proof;
- retain stable pricing contract markers: billing, plan-group, lifecycle and exact interaction-runtime asset;
- retain the new browser-level production proof as the authoritative functional oracle for toggles and public English switching.

Prevention rule: functional release proof must prefer stable semantic contracts and observable behavior over incidental copy or markup shape.
