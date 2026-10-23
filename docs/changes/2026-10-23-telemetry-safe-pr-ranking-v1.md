# CI telemetry evidence extensions (single canonical Recovery Supervisor)
The existing, main-merged `tools/delivery/recovery-pr-prioritizer.mjs` is the **sole**
PR order authority. This PR does not touch the Recovery Supervisor workflow,
create a second selector, scheduler, writer, action dispatcher or data store.

The existing daily Powerhouse CI Intelligence now also reports:
- exact workflow ID + exact candidate SHA + unique native run ID repeated-execution
  observations, with active-flight classification. Repeat is **not** a skippable
  Required or CodeQL check, runner saving, or seven-day statistical claim;
- queue-versus-execution bottleneck from >=10 paired complete job observations,
  with explicit insufficient-evidence and observational attribution.

The pure AI evidence diagnostic requires >=30 matched baseline/candidate samples,
an independent reviewer identifier, regression/security checks, shadow and canary,
rollback test and provider readback, but **cannot** grant production access.
Existing protected seven-stage policy and independent provider gates decide.
No automatic adoption or model behavior change is enabled by this PR.

Current impact is candidate only: compare actual bounded CI samples and job
coverage before/after protected merge, then read back the collector on main.
