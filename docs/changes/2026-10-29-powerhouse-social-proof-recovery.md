# Powerhouse social publishing: why a due channel cannot disappear (29 Oct 2026)

## What went wrong
Every date has separate publication obligations for personal LinkedIn, company LinkedIn and Instagram. The social-recovery runner previously looked only at decisions marked `publish`. When a personal post was rejected as a duplicate, the decision moved to `hold` and was no longer counted. With the company page published, the runner could report an overly optimistic state even though the personal post had never gone live. The existing personal-source reserve has no remaining unused verified alternatives today. Rewriting an old anecdote would not be a valid fix.

Separately, the existing OpenArt Mira Reel has a completed provider generation but its canonical Instagram media job has not received the output. This is an incomplete handoff, **not** evidence that Meta has published a Reel. Provider metadata alone cannot prove an original native MP4 or the required identity and natural-motion quality.

## Change proposed in PR #5128
The original runner now distinguishes an unconsumed, proven pre-provider duplicate from potentially already posted content. It may invoke the original `powerhouse-content-loop` for bounded source selection but may not itself select/publish a fabricated new story. A blocked daily channel remains a due obligation. All three canonical social obligations require a real provider post ID, `provider_truth_verified=true` and a proven final status; otherwise the aggregate result remains AMBER.

The existing agent skill explicitly requires a single OpenArt provider-history readback and a single controlled handoff of the exact completed video through the **existing** Instagram media router. That router retains native-video/sha, visible Mira identity ≥0.940 across three frames, temporal continuity ≥0.900, frozen editorial winner and publisher authorization. Only the existing Composio publisher may send; its provider ID and independent readback must then be retained.

## Humans and operations
- **Never re-publish an already proven company post.** Missing readback for a potentially sent post first requires reconciliation, not re-posting.
- **Never bypass the semantic duplicate gate** or invent a personal event. When all genuinely distinct verified sources have been exhausted, continue sourcing within the existing Intelligence/Content lane; keep the obligation explicitly open until a new valid candidate is confirmed.
- **Never regenerate OpenArt media merely because the handoff is stuck.** Reconcile the exact existing history, then attempt original-router validation; any quality failure creates one typed, bounded repair plan.
- **Never claim live on PR creation, test success, provider completion, or transport acknowledgement.** Protected CI, merge, production version readback and external Meta/LinkedIn proof determine release truth.

## Audit locations and acceptance
Canonical GitHub incident #4439, candidate PR #5128, Brain fingerprint `mira|media|completed-openart-history-unreconciled-generating-job|20261029-v1`, canonical learning file `brain/learning/2026-10-29-social-recovery-held-duplicate-proof-v1.json`, append-only `docs/development-ledger-events/2026-10-29-social-recovery-held-proof.md`, and regression test `tests/brain-social-recovery-held-provider-proof-20261029.test.mjs`.

Status at authoring: **candidate, not deployed/live proven**. Require no-gap seven-day evaluation, including original OpenArt→router→Meta proof and a distinct personal LinkedIn publication, before declaring prevention proven.
