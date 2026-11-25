# Legacy native blog canonical exporter readback — 2026-10-29

- Existing incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`.
- Existing canonical export function: `powerhouse-blog-export` v184.
- Fix only the legacy fallback's export GET from anonymous to service-authorized; missing service credential is a hard failure.
- Add a CI static regression to prevent the anonymous invocation from returning.
- Retain both existing DST-safe schedules, no additional scheduler, no bypass of approval.
- Release status: NOT LIVE until exact-commit Required/CodeQL, protected merge and independent workflow readback.
