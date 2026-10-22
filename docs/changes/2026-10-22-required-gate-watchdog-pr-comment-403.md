# Required Gate Watchdog PR comment permission incident — 2026-10-22

- Fingerprint: `delivery|required-gate-watchdog|owner-comment-403|20261022-v1`
- Proven failing execution: [watchdog run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147), [job 119940435969](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147/job/119940435969).
- Observed failure: `POST /issues/4656/comments` → HTTP 403 `Resource not accessible by integration`. Effective runner token: `Issues: write`, `PullRequests: read`, `Actions: write`, `Contents: read`.
- Scope disagreement: [GitHub REST docs](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment) describe an alternative of Issues **or** Pull requests write. [GitHub provider report #6994](https://github.com/github/rest-api-description/issues/6994) reproduces the issue on PR comments with Issues write + Pull requests read; granting Pull requests write is a proposed correction. The observed denial is proven; underlying GitHub provider behavior is not guaranteed.
- Effect: the earlier watchdog already dispatched one missing Required test for PR #4662, then crashed when reporting the failed Required test for PR #4656. Remaining PR scanning stopped prematurely.
- Scope of recovery: add `pull-requests: write` to the **existing five-minute** watchdog; regression guard asserts both Issues and Pull requests write. Do not introduce a second scheduler, service, security bypass, or duplicate writer.
- Exact owner report: [comment #6345553362 on PR #4656](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4656#issuecomment-6345553362).
- Required verification: exact-head Required CI, CodeQL, then new live watchdog run proving permission-correct PR comment write and marker readback. Until then the candidate is **not live-proven**. The website mobile CLS >0.100 source gate remains red until the real website code is fixed.
