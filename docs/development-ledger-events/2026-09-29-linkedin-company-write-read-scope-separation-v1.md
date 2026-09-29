# Development ledger — LinkedIn company OAuth write/read separation

- Date: 2026-09-29
- Obligation-ID: linkedin-company-oauth-write-read-separation-20260929
- Type: RECOVERY / CONTRACT_CHANGE
- Root cause: organization write readiness was incorrectly coupled to organization ACL/read permission.
- Fix: canonical company author remains urn:li:organization:18234216 (or configured equivalent); organization ACL read is optional corroboration; provider create is the authoritative write-capability probe when scope metadata is absent.
- Regression proof: tests/brain-linkedin-composio-capability-proof.test.mjs.
- Skill projection: .agents/skills/linkedin-composio-publisher/SKILL.md.
- Provider safety: 401/REVOKED_ACCESS_TOKEN still requires OAuth repair; 403 on organization read alone never authorizes fallback or duplicate publication.
- Anti-duplicate invariant: successful provider URN immediately sets republish_forbidden=true and retries reconcile that same URN.
