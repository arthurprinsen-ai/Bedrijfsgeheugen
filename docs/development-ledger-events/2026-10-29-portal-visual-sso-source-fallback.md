# Engineering ledger — SSO-blocked Portal DOM baseline, 29 Oct 2026

Obligation: `delivery|portal-visual|sso-preview-exact-source-fallback|20261029`.

Incident: Netlify non-production PR alias denied `release.json` with HTTP 401; existing workflow stopped before the protected exact-PR-source reconstruction. Last production DOM readback remained red while protected merge + deploy + public asset readback were already verified.

Repair: reuse existing same-source screenshot fallback when alias release identity is missing; retain exact SHA/immutable provider check whenever identity is present, mandatory screenshot and strict production comparison. No auth bypass.

Local proof: 13 existing/new regression cases pass. Protected Required/CodeQL and real post-merge DOM test remain release gates. Never label green on local tests.
