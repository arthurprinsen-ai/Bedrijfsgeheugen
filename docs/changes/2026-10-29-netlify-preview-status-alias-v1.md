# Portal preview check accepts Netlify's numbered PR alias

**Date:** 29 October 2026. **Status:** candidate, proven when `Portal V2 Live Preview` is green on the first PR after merge.

Netlify reports the numbered PR alias as commit status target instead of the dashboard deploy URL. `Portal V2 Live Preview` rejected it and failed on every PR since at least 27 October (180 runs seen). It is not a required status, so nobody noticed.

## Bounded implementation
- `portal-v2-live-preview.yml`: accept only `https://deploy-preview-<this PR number>--bedrijfsgeheugen.netlify.app`, read `release.json`, require the exact head SHA and a 24-hex deploy id, pin the immutable host, then run the unchanged second verification. Same approach `portal-v2-production-dom-readback.yml` already used.
- The helper `tools/ci/netlify-immutable-preview-target.mjs` is unchanged and still rejects every alias.
- `tests/brain-netlify-preview-alias-status-v1.test.mjs`: replay, shadow and a canary that makes both consumers accept the same forms, so they cannot drift again.
- Failure logged in `public.brain_failure_registry` and in `docs/learning/known-error-preflight-contract.md`, including the rule that three identical consecutive failures are a P0 even for non-required checks.

No new scheduler, permission, workflow or table. No production write.
