# Development ledger — Bedrijfslek order magnet

Date: 2026-09-29  
Fingerprint: `powerhouse-bedrijfslek-product-led-acquisition-v1`

Material change: homepage acquisition + selfscan value delivery + final-build preservation + Growth Swarm/System Map writeback.

Root cause: meeting-first CTA and partial-result leadgate created unnecessary commitment before value.

Prevention: final-build authority and regression tests treat `/zelfscan` as the homepage primary conversion route. The V18 view registry is explicitly forbidden from owning `selfscan`; `zelfscan.html` is standalone authority. Future CRO changes must preserve an ungated first-value experience unless observed order/revenue evidence justifies a controlled change.

Recovery trigger: production readback after the first merge exposed that `tools/bouw-v18-views.mjs` still overwrote `zelfscan.html` through the `selfscan` entry in `tools/v18-views-lijst.mjs`. The recovery removes that conflicting owner before the next production promotion.

Terminal production evidence: to be appended by the protected merge / Netlify readback lineage after deployment.
