# Development ledger — Company Intelligence contextual Portal V2 v1

- Date: 2026-09-28
- Scope: executive cockpit, company cockpit, impact, decisions, monitoring/learning, evidence health, roadmap
- Architecture: one reusable contextual renderer; no new datastore, dashboard or competing graph truth
- Security: customer UI remains tenant-scoped; global runtime views are not exposed directly
- UX contract: Ziet → Begrijpt → Beslist → Doet → Leert
- Outcome contract: expected and realized value stay separate; learning is evidence-backed
- Regression authority: `tests/brain-company-intelligence-contextual-portal-v1.test.mjs`
- Terminal proof required: protected main → production deploy → browser/source readback of contextual renderer and affected surfaces
