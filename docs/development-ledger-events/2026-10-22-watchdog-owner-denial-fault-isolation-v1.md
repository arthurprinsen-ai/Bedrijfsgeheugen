# Append-only development event — 2026-10-22 watchdog partial-denial isolation

- Fingerprint and obligation: `delivery|required-gate-watchdog|partial-denial-fault-isolation|20261022-v1`.
- Parent rights correction: [merged PR #4670](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4670); DO NOT repeat permission change or duplicate that owner.
- Live observed cascade failure: [run 39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147), job 119940435969; current-head Missing Required #4662 was dispatched, but owner comment for #4656 failed with 403 and stopped further recovery.
- Separate cause: unexpected comment authz exception was not isolated from unrelated Required dispatch.
- Fix: bounded typed denial + preserve independent work + mandatory non-success outcome; existing watchdog, no new scheduler.
- Regression in unchanged canonical tests; Machine learning, continuity skill, System Map and human docs in this same PR.
- Release status: CANDIDATE pending exact SHA CI and real provider evidence. The original 321 BRAIN failures and browser CLS remain independent open obligations.
