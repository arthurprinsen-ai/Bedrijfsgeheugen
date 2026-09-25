# 2026-09-25 — apply-i18n existing-assets structural short-circuit

Observed in exact-main production browser proof:
- v18 mobile drawer existed and was open;
- v18, legacy, shared and total language-select counts were all zero;
- central i18n assets were present on pricing.

Root cause: the build patch returned immediately when `data-bg-i18n-asset` already existed, preventing structural mobile selector injection.

Repair: asset idempotency and structural mobile-control idempotency are now separate. Existing assets no longer prevent selector injection.
