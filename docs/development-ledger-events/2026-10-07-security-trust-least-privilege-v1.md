# 2026-10-07 — Security Trust least-privilege hardening v1

Fingerprint: `security-trust|least-privilege|client-exposure|v1`.

Observed live posture after Security Trust Center go-live:
- 28 SECURITY DEFINER functions client-executable;
- 8 actually client-readable definer views;
- 1 client-readable materialized intelligence view;
- four additional definer views were private and therefore scanner false-positives for client exposure.

Decision:
- preserve internal/server behavior;
- remove unnecessary direct anon/authenticated EXECUTE/SELECT;
- make the posture scanner count client exposure rather than merely object type;
- keep RLS-without-policy as an informational deny-all metric.

Evidence:
- pg_catalog privilege inventory;
- trigger/cron/internal-call classification;
- 24h PostgREST access logs with zero direct use of targeted external surfaces;
- function definition inspection for privileged publisher/sales/intelligence routines.


Dry-run evidence 16:03 UTC: full migration transaction reached projected highRiskCount=0 (anon SD=0, auth SD=0, exposed definer views=0, materialized API views=0), then deliberate rollback. Immediate production readback remained 28/28/12/1 and highRiskCount=41, proving no persistent provider mutation occurred.
