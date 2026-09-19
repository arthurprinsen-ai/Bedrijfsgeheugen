# Development ledger — SEO clean URL recovery

- Date: 2026-09-19
- Obligation-ID: seo-clean-url-bedrijf-overdraagbaar-maken-v1
- Source PR: #2225
- Failure: material redirect recovery was technically correct but Required blocked because Brain learning, activity ledger and human documentation were absent.
- Prevention: closure evidence is now created before rerunning Required; redirect behavior is regression-tested.
- Status: RECOVERABLE_INCOMPLETE until exact-head gates, protected merge and production readback prove the redirect.

- Recovery incident: canonical landing serialization/branch cleanup closed #2353 while its unique redirect delta was absent from main.
- New prevention: branch==main is never sufficient terminal proof; current-main containment of the unique candidate delta is mandatory before closure/supersession.
