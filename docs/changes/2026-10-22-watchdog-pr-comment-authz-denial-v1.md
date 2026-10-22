# Required Gate Watchdog — recover PR-comment authorization denial

## Observed production failure
Existing five-minute GitHub Actions watcher [run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) on exact main 01af9f2a05794a170cd3fd63013db75a33e76268 successfully dispatched missing Required test for #4662, then received GitHub HTTP 403 Resource not accessible by integration on /issues/4656/comments. Workflow token asked for issues:write but not pull-requests:write. One denied owner recovery aborted further unrelated recovery dispatch.

## Focused correction
Existing watcher now requests pull-requests:write, distinguishes typed PR-comment 401/403 from unrelated GitHub API errors, caps owner signal attempts at two, continues independent missing Required dispatch and emits immutable typed failure. The watchdog exits non-success for ANY denied owner handoff. No new cron, scheduler, queue, PR per incident, GitHub permission bypass, blind retries or hidden errors. Source code preserves no-duplicate-comment readback marker, current head, first failing job and existing owner attribution.

## Release proof
Exact-head Required and CodeQL must complete successfully; then protected merge, real scheduled GitHub watchdog observation, and a provider-acknowledged, readable owner comment on a genuine failed current-head PR are required to promote the correction to PROVEN. This candidate is not a completed production fix. Provider/organization policies may still refuse, requiring authorized human settings review rather than a fabricated green.
