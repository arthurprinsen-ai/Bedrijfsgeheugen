# 2026-09-25 — Problem Radar contextual visual intelligence

- Obligation-ID: `powerhouse-problem-radar-contextual-visual-v1`
- Parent: `powerhouse-problem-radar-canonical-intake-v1`
- Scope: portal contextual projection; no parallel problem truth.
- Portal surfaces: executive cockpit, impact engine, next-best-actions, monitoring-learning, evidence-health.
- Contract: `config/powerhouse-problem-radar-intake-contract.json` v1.1.0.
- Regression: `tests/brain-powerhouse-problem-radar-contextual-visual-v1.test.mjs` and `tests/brain-powerhouse-problem-radar-executive.test.mjs`.
- Terminal state: candidate until protected merge, production deploy and exact readback.

## Exact-main production recovery

- Feature protected merge: `5814f26d8c6855d30983a8b0572c3ee683242928` (#2899).
- First provider readback after merge still exposed Netlify production commit `5b49ad9ebe9ee280da1c1725458d2fcd910e79ad`.
- Recovery authority: existing `Production Source Snapshot` only.
- Completion remains fail-closed until Netlify readback proves a ready production commit containing the contextual visual feature.

## Terminal production proof

Status: `LIVE_PROVEN`.

- Feature merge: `5814f26d8c6855d30983a8b0572c3ee683242928` (#2899).
- Exact-main promotion/recovery merge: `18723fd6ade2459c8c0773c4536dffeff6e291b9` (#2900).
- Netlify production deploy: `6ab62a6bdb43de00090ce33d`.
- Provider state: `ready`.
- Provider context: `production`.
- Provider `commit_ref`: `5814f26d8c6855d30983a8b0572c3ee683242928` — exact match with the contextual visual feature merge.
- Browser gates before promotion: desktop/mobile affected routes, all-public-page visibility, header readability and broad high-risk browser contracts all green.
