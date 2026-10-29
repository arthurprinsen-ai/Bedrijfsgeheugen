# 2026-10-29 runtime observability deployment false negative

- Parent: original social delivery incident #4439, original production PR #5145.
- Proven original source bug: observability publication-evidence-readback.mjs changed but Netlify release classifier emitted NOT_REQUIRED.
- Read evidence: GitHub production-release-readback run 40923639594, job 123623227648, reported NOT_REQUIRED (governance-only-change), deployment_required=false, no browser proof. Netlify published commit 6487786733cd332edd777af3881e68aca806bf92 at review; changed code merged in abaf31e1fe77f2662033782dba694e8e6bb89518.
- Root cause: NETLIFY_RUNTIME_PREFIXES/EXACT omitted Brain observability modules imported by netlify/functions/powerhouse-observability.mjs.
- Patch: add exact imported modules, authenticated production readback obligation, versioned admin-only API contract.
- Tests: tests/brain-netlify-observability-release-parity-20261029.test.mjs.
- Proof: PENDING protected merge, actual Netlify SHA match/descendant, admin/tenant readback. No claim of site or provider publication until then.
- No force deploy, new scheduler, duplicate posts or fake green.
