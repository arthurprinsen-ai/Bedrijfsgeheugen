# Risk-scoped website browser verification v1

- Date: 2026-09-19
- Obligation-ID: risk-scoped-website-browser-v1
- Bottleneck: normal/data-only website candidates executed sitewide visibility and menu browser crawls.
- Change: global browser checks are high-risk-only; normal changes remain covered by targeted affected-route verification.
- Regulatory route map: /, /ai-act, /compliance-status, /benchmark, /monitor.
- Expected effect: lower CI duration, compute cost and browser-runtime overhead without relaxing high-risk release gates.
