# Netlify runtime classifier: Brain operating-loop
Fingerprint: `delivery|netlify|brain-operating-loop-import-deployment-misclassified|20261022-v1`.

Actual postmerge readback [#39824197943](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39824197943) was a **false success for runtime**: `brain/operating-loop/living-memory.mjs` changed, but `deployment_required=false`; exact deploy and authenticated Portal readback were skipped. Netlify `brain-operating-loop.mjs` imports the changed module through `store.mjs`. This is an imported backend runtime change, not governance.

Minimal contained recovery: add imported `brain/operating-loop/` to the canonical Netlify applicability detector; keep docs/learning excluded. Preserve nonmemory projection shape in the same touched runtime module so the next protected merge triggers actual deployment. Regression `tests/brain-netlify-imported-brain-runtime-deploy-v1.test.mjs` guards positive runtime and negative governance. No alternative scheduler, waived gate or fabricated outcome.

Release requires exact-head Required/CodeQL, protected merge, Netlify production SHA and tenant-authenticated API proof; a check marked `not_applicable` never satisfies this incident.
