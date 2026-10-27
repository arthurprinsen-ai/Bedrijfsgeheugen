# Customer AI change → canonical CSRD page readback

- Obligation-ID: csrd-sovereignty-review-dashboard-sync-20261008-v1
- Reused: /api/data-sovereignty tenant readback, existing One Brain review portfolio, Portal V2 CSRD dashboard.
- Files: portal-v2/csrd-impact.js, portal-v2/page-shell.js.
- No duplicate customer page, data ledger, AI provider provisioning, ESG measurement or automatic regulatory approval.
- Security: no admin scope, no cross-tenant id in browser, no HTML injection, stale-response guard, existing customer-safe server projection.
- Test: tests/portal-csrd-sovereignty-review-link.test.mjs
- Status: protected PR candidate; production readback and authenticated customer session still require verification.

## Connector review integration

The same dashboard also reads `/api/connectors/review-queue` through the logged-in tenant's existing connector authority. Only pending `CROSS_DOMAIN_CHANGE` assessments that include `csrd_esrs_scope` become CSRD review notices. Extraction review, completed reviews, connector identifiers and internal audit IDs are not projected as compliance outcomes. Both readbacks run independently; missing evidence never yields a claimed legal or environmental approval.
