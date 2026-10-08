# Development ledger: LinkedIn scope and workspace authority isolation

- Date: 2026-10-08
- Obligation-ID: linkedin-cross-workspace-auth-proof-20261008-v1
- Fingerprint: linkedin-cross-workspace-auth-observer-isolation-v1
- Initial Brain record: `obligation:linkedin-cross-workspace-auth-proof-20261008-v1` (`OPEN` before first repository change)
- Production company provider proof: `urn:li:share:7513894237386719236`, 2026-10-08 09:33:09 UTC, `LIVE_PROVEN`
- Chat observer: three LinkedIn ACL API responses HTTP 403 requiring `r_organization_admin` while profile read succeeded
- Implementation: safe OAuth config selection and non-ambiguous org status/readback; single existing publisher preserved
- Verification required: exact-head tests, protected merge, deployment and post-change production state readback
- Current status: PENDING_PROTECTED_DELIVERY; no new LinkedIn post created by this change
