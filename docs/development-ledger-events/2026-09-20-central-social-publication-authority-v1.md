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
