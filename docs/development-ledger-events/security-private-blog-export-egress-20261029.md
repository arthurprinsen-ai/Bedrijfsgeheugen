# P0 security export containment — 2026-10-29

- Incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE` (private canonical Brain register).
- Public work item: #5072; protected candidate: #5074.
- Observed defect category: pre-approval public exposure of generated content through API and GitHub workflows.
- Emergency mitigation: authenticated approved-only Edge export v183 observed ACTIVE. This does not certify the full distribution graph.
- Source change: update exporter authorization, approval check, source function config, service caller and public GitHub commit allowlist.
- Public evidence intentionally excludes private task contents, personal data, sensitive payloads, account credentials, provider auth and internal audit raw logs.
- Tests: `tests/brain-powerhouse-blog-export-security-contract.test.mjs`; protected Required/CodeQL and independent production proof remain mandatory.
- Final status: OPEN; no historical data-erasure or end-to-end fix claimed.
