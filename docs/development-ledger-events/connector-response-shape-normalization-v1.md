# Connector response-shape normalization v1

Date: 2026-09-25

Fingerprint: `connector|response-shape|normalize-before-use|v1`

A bundled GitHub tree write failed before branch mutation because the connector response did not place the created tree SHA in the caller's expected field.

Root cause: transport-envelope coupling. The caller assumed one connector payload shape instead of resolving the required semantic tree identity through a normalization layer.

Permanent prevention:
- normalize connector responses before chained mutations;
- validate SHA/ref/id before the next side effect;
- fail closed before branch/ref mutation when identity is absent;
- fall back to same-branch serial Contents API writes when a bundled tree response cannot be normalized;
- never create a duplicate PR solely to recover from response-shape drift;
- read back commit and branch identity after every recovery write;
- continue the same lineage through exact-head CI, protected merge and applicable terminal readback;
- never treat a healthy queued/running gate as a manual handoff to the user.

This event is represented in Brain learning and projected into the connector-response normalization skill.

Delivery-control-plane observation: rerunning a failed GitHub Actions run reuses the original pull-request event payload, including its original PR body. When canonical file paths in `Change-Scope` are corrected after that event was created, a rerun alone cannot refresh that metadata snapshot. The same branch must emit one legitimate synchronize event, after which the new run reads the current PR metadata. This is not grounds for a duplicate PR or a protection bypass.

## Terminal closure evidence

- Source PR: #3100
- Protected merge commit: `bc47d636675f9fea41044667797dade0962b03ef`
- Protected `main` readback: exact commit confirmed
- Required test on candidate head: success
- Powerhouse Skill Projection on candidate head: success
- Canonical skill present on `main`: yes
- Canonical Brain learning present on `main`: yes
- Human documentation present on `main`: yes
- Regression test present on `main`: yes
- Runtime deploy applicability: not applicable; governance/docs/skills-only change

Closure rule strengthened after live readback: connector recovery is not terminal at fallback write, PR creation, merge eligibility or merge alone. The same lineage must reach the applicable terminal proof.