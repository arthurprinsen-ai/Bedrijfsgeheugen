# Central social publication authority v1 — activity ledger

- Date: 2026-09-20
- Obligation-ID: central-social-publication-authority-v1
- Parent incident: instagram-mira-visual-reel-only-v2
- Candidate: PR #2427
- Failure class: DOCUMENTED_POLICY_WITHOUT_SINGLE_RUNTIME_CHOKEPOINT
- Root cause: channel policy and learning existed, but external provider side effects were not bound to a single central authorization decision; provider-scheduled state could survive an internal BLOCKED state.
- Change: introduced short-lived one-time publication capabilities bound to exact channel/text/media/policy identity, made the canonical social publisher the only writer, retired the legacy direct Buffer writer, and added provider cancellation containment.
- Prevention: Instagram can only publish an exact-final OpenArt Mira visual or Reel after semantic vision proof and central capability consumption. Invalid scheduled provider state remains cancellation-pending until external containment is proven.
- Regression evidence: tests/brain-central-social-publication-authority-v1.test.mjs; Instagram v2 regression suite; Required test material-writeback closure.
- Learning: brain/learning/2026-09-20-central-social-publication-authority-v1.json
- Human documentation: docs/changes/2026-09-20-central-social-publication-authority-v1.md
- Skill projection: .agents/skills/instagram-composio-publisher/SKILL.md
- Terminal rule: commit/PR/merge are intermediate. Do not claim LIVE until main, migration/function deployment and production/provider readback prove the exact authority is active.


## Production closure — 2026-09-20

- Terminal status: LIVE_PROVEN.
- Main merge SHA: ae93dc264fc40d89c9c165083e352f3b3942a839.
- Production database: migration history contains social_publication_authority_v1 as version 20260920073025; capability table and both issue/consume RPC signatures and definitions were read back successfully.
- Production Edge Function: powerhouse-social-publisher version 24, status ACTIVE, verify_jwt=false.
- Exact main source was redeployed after merge. A no-token production smoke test reached the function and failed closed with HTTP 401 + UNAUTHORIZED, proving routing plus custom-token enforcement.
- Provider containment readback: Instagram pending Buffer queue returned 0 items across scheduled, sending, needs_approval, and draft.
- Closure rule: future changes may only retain LIVE_PROVEN when exact production database/function/provider readback remains machine-verifiable.
