# Tenant-bound commercial feedback series

## Change
The existing authenticated `/api/portal-state` endpoint accepts `commercialDays` (integer 1–365) and retrieves tenant-scoped `revenue_learning_evidence` through the existing EU gateway. The gateway enforces `tenant_id`, a bounded time range and a 2,000-row ceiling. No PII or global canonical commercial rows are returned.

## Evidence
Observed or inferred commercial activity is not payment verification. `verifiedRevenueEur` remains zero and `verificationStatus` remains `UNVERIFIED` until independent order/provider receipts and deduplication are implemented. The upstream response marks truncation explicitly. No revenue is claimed as live.

## Safety and release
Tenant identity is resolved by the existing authenticated server route. Tests cover tenant binding, period validation and cross-tenant fail-closed behavior. Required, CodeQL, protected merge and independent production readback remain mandatory. This change does not add the frontend charts.
