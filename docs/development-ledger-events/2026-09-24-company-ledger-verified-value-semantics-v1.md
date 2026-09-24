# 2026-09-24 — Company ledger / Verified Value semantics

- Fingerprint: `company-ledger-verified-value-semantics-20260924-v1`
- Introducing main SHA: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Inherited failure evidence: Brain foundation run `36020379269`
- Blocked delivery: PR #2792 backend lane
- Root cause: strict Verified Value eligibility replaced legacy ledger realized-value eligibility
- Fix: separate `realizedValueRecords` from strict `verifiedValueRecords`
- Legacy economics remains backward compatible
- PH-Pxxx Verified Value Created remains executed + verified + evidence-backed
- Regressions: company-ledger, company-decision-projection, dedicated semantics test
