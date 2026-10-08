# CSRD & Impact: shared customer AI/sovereignty review

The canonical Portal V2 CSRD & Impact page reads the tenant-scoped /api/data-sovereignty route and projects the existing One Brain review portfolio. The separate compliance/Data Sovereignty panel remains the owning configuration interface: this is not a second mutation path, workflow engine, business record or compliance score.

A pending CSRD/ESRS review is labeled as **not yet determined**. Candidates are allowlisted and escaped; we do not infer CSRD legal applicability, environmental measurements, energy savings or report readiness from a model/provider/residency switch. Missing/failed readback never fabricates a completed review.

The page honors same-origin credentials, no-store, latest-request revision and current-page checks before presenting asynchronous data. The live Identity server determines tenant scope; the frontend does not pass a tenant id or admin scope.

Coverage: tests/portal-csrd-sovereignty-review-link.test.mjs. Live release requires exact SHA Netlify readback and verified authenticated tenant review; the latter is not automatically proven by GitHub CI.
