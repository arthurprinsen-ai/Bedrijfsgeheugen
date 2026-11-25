# Index already proven company publications for social learning

The canonical LinkedIn company publisher already has provider-backed `LIVE_PROVEN` publication records, while the `social_posts` registry used by the learning evaluator was stale. The existing `bg-social-metrics-sync` function now **proposes** a bounded idempotent mapping from independently evidenced `canonical` LinkedIn company obligations to `bedrijfsgeheugen` brand-owned social-post identity. Unique `(tenant_id, platform, external_post_id)` protects against duplicates.

This is **identity indexing only**, never a second LinkedIn send, a provider reaction receipt, impression count, lead, paid conversion or causal learning proof. Company analytics remain `BLOCKED_ORGANIZATION_PERMISSION_403` until their actual provider scope is independently restored. Personal LinkedIn `PUBLISHED` without `live_proven_at` must not be indexed as independently proven via this company bridge.

No new scheduler or database is introduced; the source owner remains the existing six-hour provider-sync. Regression: `tests/brain-company-publication-social-registry-v1.test.mjs`. Protected checks, release and production exact URN readback are required for terminal proof.
