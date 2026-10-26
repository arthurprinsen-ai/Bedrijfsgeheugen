# 23 October 2026 — protect existing daily blog candidate against destructive hourly replay

## Provider evidence
Existing source publisher workflow https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39904068949 failed with `stale info` while force-pushing the same 23 Oct daily blog branch. A later publisher run replaced same-date blog PR #4726's reviewed content branch, removed semantic Brain learning/human change/append-only ledger and degraded its existing English translation cache. The regenerated article's content ID was unchanged; re-authoring it was unnecessary.

## Source correction
Only one original scheduler/publisher, no new queue. When an open exact-date PR exists, the workflow now fetches and checks out `origin/automation/powerhouse-blog-$DATE` **before** export rendering. If the canonical article is already present, original renderer's `NO_ACTION` safely avoids another commit. If an approved source update would require a new article, fail closed before destructive `checkout -B` and require an in-place same-PR guarded refresh by the existing owner.

Preserve already-approved English cache and validate offline; do not regenerate it on each hourly replay. New candidate with absent cache still uses sole approved translation provider and guarded normal protected workflow. Existing Required, CodeQL, Netlify, public readback remain mandatory.

## Acceptance
`node --test tests/brain-daily-blog-preserve-open-candidate-v1.test.mjs` and complete exact-head Required + CodeQL, protected merge and native same-day next-run readback. Do not assert blog LIVE_PROVEN from this workflow patch alone. Older pending blog PR #4570 touches this workflow: reconcile source ownership and avoid overwriting its 21 October artifact.
