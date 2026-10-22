# 2026-10-15 · Powerhouse Foresight tenant signal overlay

Obligation: powerhouse-contextual-foresight-4420
Scope: existing customer portal intelligence source overlay; no separate engine or table.
Source read authority: /api/portal-ondernemersdata authenticated Netlify Identity + tenant-bound EU gateway; canonical external signal is not itself customer evidence.
Implementation: tenant identity check, company score filtering, source/date evidence, candidate actions, source catalog, isolated no-data state.
Guardrail: observed and scored signal != causal forecast, approved policy, financial benefit, or fulfilled action.
Verification: native portal regression, canonical Brain replay/shadow/canary; CI/CodeQL/protected merge and production readback are still pending at candidate stage.
