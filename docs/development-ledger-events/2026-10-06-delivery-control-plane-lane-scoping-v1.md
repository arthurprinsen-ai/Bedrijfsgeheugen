# 2026-10-06 — Delivery control-plane lane scoping

- Source observation: PR #3974 exact-head Required run `37483356772`.
- Symptom: workflow-only delivery-control changes still activated the website/browser lane.
- Root cause: generic `.github/workflows/` shared classification took precedence over explicit lane ownership.
- Fix: explicit configured lane ownership wins; known control-plane workflows receive narrow owners.
- Safety: unknown workflow paths remain full-suite shared and fail conservative.
- Expected result: delivery-control PRs run automation/backend only unless they actually change a website/portal-owned workflow or runtime path.
