# Growth-drain source-time parity, 25 October 2026

- Obligation-ID: netlify|growth-drain|event-source-time-parity|20261025-v1
- P0 owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4446
- P0 commercial: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Root evidence: independent Supabase readback found 168/176 recent inserts are source events more than 1h old; 7 genuinely occurred since release; 0 first-party CTA clicks
- Change: aggregate source-time freshness counters and honest backlog-completion unknown in existing growth-drain
- Guard: same one-minute schedule, unchanged DataHub receipt, no PII, no provider or revenue fabrication
- Test: `node --test tests/brain-growth-drain-time-budget-v1.test.mjs`
- Terminal: Required/CodeQL/Netlify protected release + independent event-source freshness log, separate commercial evidence
