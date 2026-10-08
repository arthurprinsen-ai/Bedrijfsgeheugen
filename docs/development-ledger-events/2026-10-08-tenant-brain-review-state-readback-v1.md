# Brain review readback integration

- Obligation: tenant-brain-review-state-readback-20261008-v1.
- Existing authority: Supabase EU sovereignty snapshot and canonical `brain_obligations`.
- Changed: authorized tenant-scoped readback, safe status-only projection.
- Security: exact tenant identity and reviewed version, no wildcard cross-tenant reads and no proof/approval inflation.
- Regression: `tests/brain-tenant-sovereignty-review-readback.test.mjs`.
- Production evidence: pending merge, Edge production deployment and authenticated customer GET readback.
