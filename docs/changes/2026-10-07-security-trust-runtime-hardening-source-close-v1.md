# Security Trust runtime hardening source close v1

Production hardening performed on 7 October 2026 is source-closed using the exact Supabase migration versions.

- 20261007163124: fixed search_path on four helper functions.
- 20261007163230: converted eight browser-readable SECURITY DEFINER views to SECURITY INVOKER, revoked anon/authenticated access, and removed a materialized cache from the API surface.
- 20261007163333: refined Trust posture semantics so browser exposure is high-risk, while browser-executable privileged RPCs are an explicit review surface rather than an automatic critical vulnerability.

Production readback after hardening:
- Supabase security advisor target lints: 0.
- browserReadableDefinerViews: 0.
- materializedViewsApiReadable: 0.
- highRiskFindingCount: 0.
- postureStatus: EVIDENCE_PARTIAL.
- evidenceCoverage: 67.

The remaining 28 privileged RPCs require authorization review and the 166 RLS-without-policy tables require intent classification. Neither is silently marked green.
