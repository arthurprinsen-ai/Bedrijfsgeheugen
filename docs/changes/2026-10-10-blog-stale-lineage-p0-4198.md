# 10 October: Recover same-day canonical blog publication after regenerated source

## Verified failure
The daily blog decision changed from an expired CPNL subsidy to current Wet DBA coverage. Supabase stored the new **source-backed artifact** but the existing same-day `content_publication_obligations` record kept the old CPNL slug. The blog export privileged that stale slug, and the canonical GitHub hourly job refused to re-render when same-date PR #4300 was open. Leaving the PR ready to auto-merge would publish obsolete content.

## Existing-state-first repair
No new blog owner, scheduler, repo branch, CRM or write path:
- `powerhouse-blog-export` derives unproven slug, content ID and canonical URL from the **current content artifact**, not stale mutable metadata; it fails closed if the obligation is no longer just GENERATED.
- `powerhouse-blog-queue` can conditionally remap the **same** day/channel GENERATED obligation only if there is no published, provider-created, potentially sent or republish-forbidden content. A provider-side effect is never overwritten.
- The existing GitHub hourly daily-blog workflow refreshes **the same open PR** from the latest protected main and re-renders current content, preserving required translation, CI, Netlify and public proof steps. No duplicate new PR.

## Closure
Protected checks -> merge same PR -> Netlify deployed -> actual public URL/readback -> update same POWERHOUSE obligation and Brain learning. This code alone is **not** public publication proof.
