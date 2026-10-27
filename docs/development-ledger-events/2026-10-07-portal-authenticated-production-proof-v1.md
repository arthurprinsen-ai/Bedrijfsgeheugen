# Development ledger — Authenticated Portal production proof v1

- Obligation: `portal-authenticated-production-proof-v1`
- Candidate type: implementation
- Delivery lane: portal
- Failure class: `PORTAL_AUTHENTICATED_PRODUCTION_HTTP_PROOF_MISSING`
- Previous evidence: client bearer wiring, protected Portal tests, deployed `portal-ondernemersdata` function and live underlying production data were proven.
- Remaining gap: no autonomous real Netlify Identity end-user JWT had produced an authenticated HTTP 200 against `/api/portal-ondernemersdata` on the exact immutable production deploy.
- Fix: production `deploySucceeded` canary creates a temporary Identity user, obtains a short-lived real JWT, calls the immutable deploy, validates authenticated tenant scope + response contract, deletes the user and writes only non-sensitive proof.
- Release rule: Production Release Readback must match both commit SHA and Netlify deploy ID and requires `status=PROVEN`, HTTP 200, tenant-scope verification, payload verification and synthetic-user cleanup.
- Security rule: no service-role bypass, permanent test account, persisted JWT/password/email/user-id or synthetic tenant business data.
- Classification rule: every `netlify/functions/portal-*` change is included in the protected Portal lane.
- Production claim: withheld until protected merge and exact production authenticated proof receipt is `PROVEN`.
