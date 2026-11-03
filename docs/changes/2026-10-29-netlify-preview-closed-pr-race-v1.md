# Portal preview check ends cleanly for closed PRs

**Date:** 29 October 2026. **Status:** candidate, proven when `Portal V2 Live Preview` is green on a PR that stays open.

After the alias fix the check still ended red. Auto-merge closes a PR within minutes, the preview run starts after the merge, the numbered alias no longer serves the PR head, and the wait loop timed out after 9 minutes. Twelve such runs were seen after the alias fix.

## Bounded implementation
- `portal-v2-live-preview.yml`: the wait step reads the PR state every round. For a closed or merged PR it writes a notice, sets `PREVIEW_PR_CLOSED=1` and exits 0; the later steps (except the evidence upload) are skipped. Open PRs keep the full wait and still fail on a provider failure or timeout.
- No new token permission (`actions: write` is not added).
- `tests/brain-netlify-preview-alias-status-v1.test.mjs`: replay for the closed-PR path and a shadow test for the open-PR path.
- Fingerprint logged in `public.brain_failure_registry` and in `docs/learning/known-error-preflight-contract.md`.

No new scheduler, workflow or table. No production write.
