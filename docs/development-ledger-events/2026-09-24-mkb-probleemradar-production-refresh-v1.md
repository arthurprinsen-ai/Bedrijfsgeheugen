# 2026-09-24 — MKB Probleemradar production refresh

- Obligation: `mkb-probleemradar-production-refresh-20260924-v1`
- Trigger: production lag after PR #2735
- Blog merge SHA: `30fb4a546313ee1fc824410b265de9d2e667515c`
- Main observed before refresh: `350f90eb9b2c76a715530836a7d9c485c2ccdd42`
- Netlify production observed: `e648f6c8e07bc2185daab6c71b0adff26d020d68`
- Action: protected Production Source Snapshot refresh
- Security: no transient proxy credential persisted or logged
- Terminal state: pending exact Netlify production SHA + three-route readback
