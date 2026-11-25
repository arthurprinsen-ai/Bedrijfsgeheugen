# 2026-10-20 — SalesRobot early-readiness self-healing checkpoint
- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `commercial|salesrobot|early-truth-readonly-canary|20261020`
- Evidence: DISCONNECTED, cookieExpired=true, TRIAL_EXPIRED, daysOfExecutionRemaining=0, campaign PAUSED. CRM: 23,295, 605 email, 0 individually approved.
- Root cause: SalesRobot probe after AI/composer/SQL, dry-run inadvertently modified canonical state.
- Source-only remediation: preflight once before other tasks, persist authoritative capability truth on normal runs, early read-only canary.
- Test: `tests/brain-salesrobot-linkedin-readiness-v1.test.mjs`; all existing consent and no-double-send guards remain.
- Acceptance pending until protected merge + exact Supabase Edge source readback; external entitlement and human recipient authority still required.

