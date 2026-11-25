# CSRD production route and live customer truth (P0 #4215)

## Observed failure
The production CSRD browser probe selected the first button containing the text "CSRD & Impact", rather than the canonical page ID. It could therefore act on a misleading navigation target instead of verifying the V2 cockpit. The CSRD snapshot fallback also supplied static example indicators when an authenticated tenant had not yet provided resource evidence.

## Corrective action
- Select the canonical `data-nav-target="csrd-impact"` and confirm the opened `#portalView[data-page-id="csrd-impact"]`, active V2 view and visible CSRD cockpit in production DOM.
- Keep example KPIs in demo/anonymous context only. Any real signed-in customer, including an empty account or failed persisted readback, sees unknown CSRD readiness/footprint until source data is evidenced.
- Preserve tenant identity, protected-trust authorization, provenance, and no fabricated legal applicability.
- Add deterministic regressions for tenant fallback and demo distinction.

## Remaining independent release gates
This change does not prove official CSRD/ESRS applicability for a customer, a source-universe new-law event through company graph to tenant, or an authenticated two-tenant write→Brain→impact/roadmap readback. Those requirements remain open under #4215 until external source evidence and real authorized browser sessions are supplied. No auto-green on anonymous DOM coverage.