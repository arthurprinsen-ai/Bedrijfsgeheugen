# Development ledger — candidate type closure canonicalization v1

Date: 2026-09-25  
Obligation: `candidate-type-closure-canonicalization-v1`  
Fingerprint: `delivery|candidate-type-docs-closure-canonicalization|v1`

A docs-only Powerhouse borging lineage reached admission with `Candidate-Type: closure`. The gate correctly rejected it, but the failure was preventable upstream.

The parser now canonicalizes `closure -> docs` only for `Delivery-Lane: docs`. Non-docs uses remain invalid. Continuity skill and Powerhouse policy require canonical metadata at creation and same-lineage recovery after correction. Regression coverage proves both the positive docs case and negative non-docs case.
