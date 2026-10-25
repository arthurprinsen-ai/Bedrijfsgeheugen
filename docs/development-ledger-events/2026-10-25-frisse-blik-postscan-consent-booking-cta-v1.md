# Growth source → consented booking continuation — 2026-10-25

- Parent-P0: #4198; prior metadata fix: #4856 merged on main 32ff28964e5e784da754a996cffa9b360233cd15.
- Production observation: 14 last-seven-day `scan_completed` events, 0 canonical `commercial_leads`; all 14 events have no person/company attribution. No inference that form failed or any claim of revenue.
- Existing route: `frisse-blik.html` `openLead()` + mandatory `ldOk` consent + active Calendly event `https://calendly.com/arthur-prinsen/adviesgesprek-slimmer-geregeld`.
- New reversible UI-only hypothesis: prominent result-area CTA using original consent and provider integration; no booking sent during development.
- Evidence contract: protected latest-head tests and Netlify browser, main deployment parity, source readback, then independently observed Calendly booking and downstream outcome. No false-green orders or automatic contact of anonymous visitors.
