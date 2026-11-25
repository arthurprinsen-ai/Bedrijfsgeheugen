# 2026-10-23 Recovery Supervisor missing terminal lease diagnostic

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Primary original implementation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4793
- Held duplicate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4792
- Obligation: `delivery|recovery-supervisor|typed-missing-lease-regression|20261023-v1`
- Fingerprint: `delivery|recovery-supervisor|missing-terminal-lease-signal-unobserved|20261023-v1`
- Root: missing owner lease rejected exact-HEAD branch refresh; merged telemetry did not classify its runtime message.
- Fix: typed runtime-only event parser, per-real-run dedupe and repeated missing-lease evidence.
- Non-goals: owner lease promotion, branch mutation, new scheduler, second brain, ruleset change, fake green, production relaunch.
- Acceptance: exact-head CI/CodeQL, protected merge and hourly provider artifact plus independent customer outcome truth.
