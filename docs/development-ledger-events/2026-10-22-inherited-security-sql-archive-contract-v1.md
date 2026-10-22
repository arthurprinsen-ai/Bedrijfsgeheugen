# Append-only event — six historical security SQL source contract recoveries

- Date: 2026-10-22
- Obligation: ci-inherited-security-sql-archive-20261022
- Parent: #3742
- Release dependency: #4573
- Observed source: Unified BRAIN #39671036043; backend job #119469063095; 321 failed, 3190 passed
- Root cause: obsolete executable SQL file reads within six original test cases
- Correction: preserve SQL assertions and replace source path with exact archived immutable Git blob
- Regression: tests/brain-inherited-security-sql-archive-contract-v1.test.mjs
- Governance: powerhouse-green-assurance skill projection; Brain learning and human change document
- Security: runtime SQL, grants, RLS, ACL, scheduler and provider state untouched
- Proof state: CANDIDATE_UNVERIFIED; do not count as passed until exact-head GitHub runner accepts
- Required next proof: Required CI, CodeQL, full Unified BRAIN 0 failures, #3742 history parity, #4215 real two-tenant customer readback, protected merge and production readback
