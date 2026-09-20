# Daily SEO revenue execution — v2

## Purpose
Daily SEO work must optimize for qualified demand, leads, orders and revenue rather than merely produce content.

## Decision contract
Each daily cycle ends in exactly one evidence-backed action: `UPDATE_MONEY_PAGE`, `CREATE_INTENT_GAP_CONTENT`, or `NO_ACTION_EVIDENCE_INSUFFICIENT`.

A new article is permitted only for a distinct evidenced search-intent gap. If an existing canonical money page owns the intent, improve that page. If current commercial evidence is insufficient, fail closed instead of selecting the oldest approved article.

## Delivery and learning
For a content creation decision, the same obligation writes the complete content, internal links and conversion path, then uses candidate PR → required gates → protected merge → production readback. Search/CTA/lead/order/revenue outcomes are written back for later cycles.

## Incident learning
PR #2428 initially used an invalid Candidate-Type and was rejected by admission. The metadata was corrected to `implementation`; admission then passed. Material writeback subsequently correctly blocked the candidate because Brain learning, ledger and human documentation were missing. These three closure artifacts are now carried in the same lineage rather than bypassing the gate.

Status remains non-terminal until exact protected delivery and production/main readback succeed.
