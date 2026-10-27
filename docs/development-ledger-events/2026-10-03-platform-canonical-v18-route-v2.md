# Platform canonical V18 route — 2026-10-03

Readback after PR #3608 confirmed:
- runtime protection was merged;
- the static mobile homepage anchor still originated from the pinned V18 payload;
- desktop already targeted /product.

Recovery v2:
- canonical V18 production build rewrites the historical mobile Platform target to /product before output;
- build fails closed if that expected legacy repair point is absent;
- runtime normalization remains defense in depth.

Acceptance: generated homepage HTML and real browser navigation must both resolve Platform to /product.
