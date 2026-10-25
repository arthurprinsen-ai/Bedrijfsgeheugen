# Manual production readback without forced Netlify deployment

The readback workflow's manual dispatch sets `forceBrowser` to obtain runtime browser evidence. Deployment applicability previously used that flag as if a new Netlify build were mandatory, which blocked governance-only merges on a stale-but-correct provider SHA.

Corrected `tools/delivery/netlify-deployment-applicability.mjs` separates evidence-gathering from deployment impact. Only a real website/portal/Netlify-runtime change or explicit `forceDeployment` requires promotion. `forceBrowser` remains an independent browser proof request. Tests cover governance-only and runtime cases. The existing protected release checks and provenance requirements remain unchanged.

Until required checks, protected merge and downstream readback succeed, this change remains a candidate. No Netlify deployment or revenue claim is made.
