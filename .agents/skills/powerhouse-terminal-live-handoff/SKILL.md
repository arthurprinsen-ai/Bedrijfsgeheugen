---
name: powerhouse-terminal-live-handoff
description: Use for every Bedrijfsgeheugen/Powerhouse website delivery, live request, Netlify promotion, production reconciliation, terminal user handoff and post-live governance closure.
---

# Powerhouse Terminal Live Handoff

Fingerprint: `delivery|terminal-live-handoff|main-netlify-browser-live|v1`.

Always resolve and communicate five separate states:

1. `MAIN` — intended change is on protected main.
2. `NETLIFY_PRODUCTION` — Netlify/provider confirms production deployment.
3. `WEBSITE_READBACK` — relevant production route/function is tested as a real visitor.
4. `LIVE` — the requested behavior is functionally proven on production.
5. `BORGING` — skills, agents/chats, Brain learning, ledger, human docs and System Map/control-surface projection are durably written and read back.

Before mutating anything after a repeated "zet live", reconcile current production. If the requested behavior is already functionally proven, do not rebuild the feature, create a replacement PR, or start a duplicate Netlify delivery lineage. Complete only missing post-live closure and report it as `BORGING_PENDING`.

Terminal response format:
`MAIN ✓ | NETLIFY PRODUCTION ✓ | WEBSITE READBACK ✓ | LIVE ✓ | BORGING ✓`

Use `NVT` only where genuinely not applicable. Never collapse main, deploy and live into one status.

All current/future chats, agents, charts, dashboards and delivery control surfaces inherit this model through One Brain and System Map governance.
