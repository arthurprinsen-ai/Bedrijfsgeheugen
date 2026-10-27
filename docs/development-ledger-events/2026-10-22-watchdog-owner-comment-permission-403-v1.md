# Append-only delivery event — 2026-10-22

- Obligation-ID: `delivery|required-gate-watchdog|owner-comment-403|20261022-v1`
- Event: `RECOVERY_CANDIDATE` (not verified live)
- Failed main watchdog: [run #39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147), [job #119940435969](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147/job/119940435969).
- Trigger: `POST /issues/4656/comments` returned 403 with effective Issues:write and PullRequests:read.
- Causal hypothesis: GitHub integration PR conversation comment requires pull-requests:write, matching [upstream #6994](https://github.com/github/rest-api-description/issues/6994).
- Remediation: change only existing Required Gate Watchdog permission and its regression contract; append Brain learning entry with the same fingerprint.
- Security invariants: no Required/CodeQL/CLS bypass, no extra scheduler, no duplicate writer, no false successful owner handoff.
- Verification state: PENDING exact-head CI, CodeQL, protected merge and a successful post-merge PR comment write/readback.
