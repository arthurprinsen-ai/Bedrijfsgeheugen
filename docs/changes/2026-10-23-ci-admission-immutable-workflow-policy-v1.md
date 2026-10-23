# Version-pinned CI admission across older pull-request heads
Date: 2026-10-23
Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Observed Required failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39948460112

## Root cause
Required called the updated Powerhouse Delivery Hygiene workflow while checking out exact PR #4776 head ba83c77002a5d4626b385a56e2a2edbcc93a83f3. That candidate predated tools/delivery/github-admission-rate-limit.mjs, merged on main through #4775. The admission job failed with ERR_MODULE_NOT_FOUND before reading candidate metadata; umbrella Required became red with every downstream lane skipped. This is workflow/candidate source skew, not proof that the portal change is invalid.

## Change, bounded to the existing gate
Preserve the exact candidate checkout and all required CI and CodeQL policies. Resolve only the pure admission error classifier from the Git object at immutable github.workflow_sha, using a single-depth git fetch only if the workflow commit is absent in the shallow checkout. Git show extracts only tools/delivery/github-admission-rate-limit.mjs to runner temporary storage, never overwrites candidate files or reads moving main. Node imports that pinned source. The wrapper rejects invalid SHA, unavailable object, missing blob or empty file with CONTROL_PLANE_POLICY_SOURCE_UNAVAILABLE, admitted=false, and a canonical failure artifact. No alternative source, rate-limit retry loop, queue, cron, privileged API or CI bypass.

## Verification
Extend the original classifier suite with a disposable local git repository that creates trusted policy version A, checks out an older candidate without the helper, proves rate-limit/authorization classifications, then rejects an invalid policy ref with exit 78 and an admitted=false receipt. Exact-head Required, hygiene, CodeQL, protected squash merge and provider readback are required before claiming recovered PR throughput. Existing Portal writer #4776 remains owner of its own candidate and main synchronization. Production deployment is not applicable for a CI-only gate update unless the existing applicability classifier says otherwise.

## Desired measured outcome
Compare admission false-red rates and repeated Required reruns on immutable SHA before/after via existing #4661 telemetry, not an invented speedup. Any further errors have to be observed on exact current head; no guaranteed green or customer-uplift claim.
