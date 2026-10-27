# Canonical source-provider error classification event

- Date: 2026-10-25
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing incident fingerprint: external-intelligence|tavily-limit-dataforseo-fallback-remote-failure|20261025-v1
- Live proof: request 12518, Edge v16, HTTP 207, 2/3 source queries, 18 real results, 2 allowed; provider status undetermined
- Recovery: existing bounded single retry also covers documented temporary 50301-50304; numeric status only stored in existing source lineage
- Test: tests/brain-external-signal-quota-failover-20261019.test.mjs
- Stop condition: fail closed on credentials, quota, billing, rate and unsupported provider statuses
- No new scheduler or duplicate incident registry; production acceptance pending
