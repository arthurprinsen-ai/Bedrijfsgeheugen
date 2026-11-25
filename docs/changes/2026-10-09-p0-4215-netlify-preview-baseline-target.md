# P0 #4215 — exact Netlify preview visual baseline provenance recovery

## Production incident
Protected PR #4236 was merged at `869b950108ae9a122f51191632bd9b61b20776bb` and the exact-main Netlify release, Source Snapshot and Release Readback passed. Production DOM workflow #37908103412 failed at **Resolve approved visual baseline** after 60 bounded checks: no successful Portal V2 PR visual head `6ae215e539a989aa32a38bccc8cf7e0982f38805` was recorded.

The exact-head PR preview run #37908040948 timed out after 48 attempts at **Wait for exact Netlify preview SHA**. Workflow used `$target/release.json` where `$target` came from GitHub's `netlify/bedrijfsgeheugen/deploy-preview` status. The actual status target is `https://app.netlify.com/projects/bedrijfsgeheugen/deploys/<id>` — a dashboard resource, not the deploy origin. Furthermore, one provider deploy for that PR head was canceled for no content change while the GitHub status was `success`; a provider status alone is not immutable artifact evidence.

## Root-cause repair
- Add `tools/ci/netlify-immutable-preview-target.mjs`, which accepts only HTTPS Netlify dashboard deploy targets or exact immutable deploy hosts under the configured Bedrijfsgeheugen Netlify subdomain. Reject arbitrary domains, credentials, ports, paths, query parameters and malformed IDs.
- `portal-v2-live-preview.yml` now resolves the immutable URL from that trusted provider source, requests its `release.json`, and requires BOTH the exact PR head `commit_ref` and matching `deploy_id` before any browser test, screenshot capture or baseline upload.
- Keep failure on canceled/no-content-change builds without an exact immutable deploy. Do not bypass CI, use fallback screenshot from another SHA, or fabricate visual approval.
- Regression runs in canonical historical/shadow/canary learning and Required preflight.

## Verification
`node --test tests/brain-p0-4215-netlify-preview-immutable-target-v1.test.mjs`

This fixes future approved-visual evidence resolution; it does not retroactively make run #37908103412 a pass. A **new** qualifying exact-head approved preview and exact-main Portal DOM readback must be successfully completed for the latest protected production revision. Customer tenant A/B and P0 remaining acceptance requirements continue independently.
