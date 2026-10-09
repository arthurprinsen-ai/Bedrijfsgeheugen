# P0 #4215 — production visual readback when Netlify correctly skips CI-only main commits

## Independent failure cause
The Netlify site uses `netlify.toml [build].ignore = node ./tools/ci/netlify-ignore-build.mjs`. This intentionally skips new production deploys for commits containing **only** GitHub Actions workflows, tests, learning and documentation. PRs #4243 and #4246 correctly merged with passing protected tests, but they do not modify any Portal V2 runtime assets. Therefore the existing Portal V2 DOM workflow's demand that the published `release.json.commit_ref` equal the *latest governance-only main commit* can never succeed, even though the portal code published at the previous runtime commit is identical. Prior run #37912576177 had been dispatched for main after #4246 and blocked waiting for a nonexistent new runtime deployment.

## Existing-state fail-closed repair
- Extend the existing `workflow_dispatch` with optional `expected_production_sha` alongside compulsory `approved_pr_number`.
- When a production override is provided, it MUST be a full 40-character SHA with a GitHub compare relationship `ahead` or `identical` to current checked-out main; reject non-ancestral SHAs and file comparisons containing 300+ entries (not safely exhaustive).
- Reject any changed file outside **only** `.github/workflows/`, `tests/`, `docs/` or `brain/learning/`. This excludes Portal V2 runtime code, Netlify config/functions, site assets, package/dependency changes, backend code and any unknown path.
- Set the expected published commit to that proved runtime-equivalent ancestor. Require live Netlify alias release + immutable deploy release both match it before browser readback. Never state that code's SHA is equal to the latest main; the claim is explicitly *runtime-equivalent for these scoped changes*.
- For P0 #4215, dispatch on latest main with `approved_pr_number=4240` and `expected_production_sha=7048fa85accbae9305324d9c9aec40d1a0ab9ea9`, subject to a fresh production provider check and scope proof.
- Continue the visual baseline replay from protected merged PR #4240 and exact immutable preview; require strict Playwright visual comparison unchanged.

## Limitations
This fixes proof routing when Git CD intentionally skips an unchanged runtime build. A passing workflow must still attach the terminal provider and visual evidence. It cannot prove actual authorized customer tenants, complete provider input fields, >750KB transactional outbox consumer ACK, or client-specific CSRD/ESRS legal applicability. Keep P0 #4215 open until these separate conditions have real evidence.
