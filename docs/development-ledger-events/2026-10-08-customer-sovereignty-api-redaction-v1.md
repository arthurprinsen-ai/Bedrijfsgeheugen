# Customer sovereignty – API and UI evidence parity

- Obligation-ID: customer-sovereignty-api-redaction-20261008-v1
- Cause: sensitive internal impact metadata present in customer GET/POST JSON, despite UI-only hiding.
- Change: central public readback projection, wired into tenant-authorized GET and policy POST.
- Validation: `tests/brain-sovereignty-customer-api-redaction-v1.test.mjs`; server-side audit remains unchanged.
- Closure evidence: pending protected merge, production deploy and authenticated customer GET/POST validation.
