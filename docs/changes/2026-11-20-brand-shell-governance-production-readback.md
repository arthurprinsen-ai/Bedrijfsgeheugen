# Canonical Brand Shell — control-plane-only Netlify release truth (20 Nov 2026)

## Observed first-party incident

Original protected browser repair PR #6085 merged on main as SHA `92d63c8891132edaebc78dcb0cf01be1c66c0f96`. Its source scope was six purely governance/test paths, including `tools/site-shell/verify-targeted-website-routes.mjs`, the original agent skill, learning, regression and documentation. Netlify correctly returned **Canceled build due to no content change** for `6b00cac76de18dc69d633a32`, because there was no changed website or hosted server runtime artifact. Production remained on the last genuinely published runtime deployment.

Nevertheless the **original** `canonical-brand-shell-live-readback.yml` still required an exact Netlify deploy of the merge SHA: its privately duplicated governance allowlist missed `.agents/` and `tools/site-shell/verify-targeted-website-routes.mjs`. This caused the shell readback to retry a deployment that was both unnecessary and unavailable.

Source run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44829960523 (check final job status independently); Netlify evidence: https://app.netlify.com/projects/bedrijfsgeheugen/deploys/6b00cac76de18dc69d633a32.

## Source-bound preventive fix

Keep **one canonical classification**: import `NETLIFY_GOVERNANCE_EXACT`, `NETLIFY_GOVERNANCE_PREFIXES` and build-runtime override `NETLIFY_BUILD_RUNTIME_EXACT` from `tools/delivery/netlify-deployment-applicability.mjs` within the existing shell workflow. For governance-only deltas, accept the last **real** production SHA as an ancestor of current protected `main` without claiming a new website deploy. For any hosted runtime change—even when mixed with governance changes—demand the new exact deployment and fail closed until a provider-backed release is ready.

The original workflow still checks public HTML, canonical release identity, SEO order, growth-event HTTP405, every public page's actual rendering and visual regression. No second workflow/scheduler, fake deploy, new secrets, approval bypass or customer revenue claim.

## Test & rollback

`tests/brain-brand-shell-governance-supersession-20261120.test.mjs`: uses the existing single classifier to replay the exact six changed files from #6085 (positive non-deploy), plus negative tests for portal, site, Netlify functions, production build entry and mixed changes. Static authority guards require live Git ancestry, immutable proof, SEO, growth and browser gates. `brain/learning/2026-11-20-brand-shell-governance-classifier-drift-v1.json` tracks historical/shadow/canary evaluation. Original Delivery Self Optimization skill updated with recurrence rule.

Rollback only through protected PR revert, preserving original incident and provider identities. All 14 original innovation operations remain open until independently measured consumer/Heartbeat outcomes.
