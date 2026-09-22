# 2026-09-22 — Composio Netlify source rebuild

- Fingerprint: `composio-netlify-source-rebuild-v1`
- Observation: Netlify production reports `deploy_source=api`.
- Consequence: a GitHub merge does not automatically rebuild Functions after an environment-secret rotation.
- Recovery: generate an exact current-main source ZIP and submit it through the authorized Netlify build proxy.
- Security: no provider secret is stored in repository evidence.
- Terminal proof: new production deploy → Composio provider acceptance → Supabase setup-state readback.
