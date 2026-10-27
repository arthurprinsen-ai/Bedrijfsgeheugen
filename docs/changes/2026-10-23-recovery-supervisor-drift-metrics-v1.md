# Measurable Recovery Supervisor drift without a second scheduler
Date: 2026-10-23. Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
Prior protected release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4781
First production supervisor run #39960974891 succeeded but emitted 49 drift classification events and 58 refused unleased writes. These are events, not unique successful recoveries.
The same workflow emits bounded run-local counters: unique drift PRs, repeat drift, lease denial, native CAS requested/accepted/proven/rejected, and attempt-budget exhaustion. This yields a GitHub Actions artifact and step summary, not another runtime or canonical learning store.
No new scheduler, provider data reads, PR writer or autonomous authorization. Required, CodeQL, protected merge and independent production/customer proof remain mandatory.
Test: node --test tests/brain-recovery-supervisor-drift-metrics-v1.test.mjs. Status: candidate until protected CI and first post-merge runtime receipt.
