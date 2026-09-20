# Development ledger — Composio security / merge admission

- Date: 2026-09-20
- Incident PR: #2475
- Incident head: `539a9a934d11f6373636da6144a38e76b8f28e46`
- Main after incident: `2dba4f0966ebf3d0153427f729d6f89bce5a01bf`
- Product runtime ACL readback: only postgres + service_role EXECUTE; browser/public roles absent.
- Repository defect: non-canonical REVOKE ALL syntax for SECURITY DEFINER function.
- Delivery defect: merge occurred before canonical Required terminal success while security/preview siblings were red.
- Recovery obligation: `composio-security-required-merge-admission-v1`
