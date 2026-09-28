# Development ledger — Company Intelligence contextual Portal V2 v1

- Date: 2026-09-28
- Scope: executive cockpit, company cockpit, impact, decisions, monitoring/learning, evidence health, roadmap
- Architecture: one reusable contextual renderer; no new datastore, dashboard or competing graph truth
- Security: customer UI remains tenant-scoped; global runtime views are not exposed directly
- UX contract: Ziet → Begrijpt → Beslist → Doet → Leert
- Outcome contract: expected and realized value stay separate; learning is evidence-backed
- Regression authority: `tests/brain-company-intelligence-contextual-portal-v1.test.mjs`
- Terminal proof required: protected main → production deploy → browser/source readback of contextual renderer and affected surfaces

## Security evaluation closure

- Security-sensitive learning canonicalization requires historical replay + shadow + canary.
- Added `tests/brain-company-intelligence-contextual-portal-shadow-canary-v1.test.mjs`.
- Shadow invariant: tenant A output contains no tenant B identifiers, sources, actions or learning, and vice versa.
- Canary invariant: expected value and realized value remain separate.
- Fail-closed invariant: absent tenant evidence renders unknown context rather than synthesized business facts.

## Runtime context addendum

- Roadmap resolves the secured `portal.runtime` projection before rendering Company Intelligence context.
- Derived roadmap cards expose available impact and effort context visually; absent values remain absent.
- Capability Graph now receives the same contextual intelligence layer.
