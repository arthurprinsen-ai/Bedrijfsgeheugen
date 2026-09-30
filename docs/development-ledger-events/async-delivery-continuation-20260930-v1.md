# Async delivery continuation — ledger event

Date: 2026-09-30
Obligation: agent-continuity-queue-supersession-20260930
Fingerprint: delivery|async-continuation|nonblocking-workflow-wait|v1

Observed defect: concurrent agents/chats created overlapping remote CI/provider work and could remain blocked on queued/running GitHub, Netlify or Supabase jobs instead of continuing from durable execution state.

Root cause: remote workflow waiting was not uniformly treated as resumable asynchronous state; stale reversible production snapshot work could remain queued; some required jobs lacked a hard runtime bound; queue-pressure thresholds had drifted between AGENTS.md and the canonical continuity policy.

Change: production snapshot latest-main supersession, 20-minute bounds, non-blocking checkpoint/resume contract, exact-head run reuse, canonical policy/skill/System Map projection, and queue-pressure threshold alignment.

Evidence before change: recent 100-run sample contained 4 pending and 10 in-progress runs; one recent SHA had 13 runs. PR #3421 admission also exposed metadata/writeback closure defects and was repaired in the same lineage.

Prevention: pending/queued/in-progress is never a terminal user handoff; one active required workflow per exact head; batch writes before CI; bounded polling; newer main supersedes stale reversible production waits; closure artifacts must include Brain learning, development ledger, human documentation, skill and System Map writeback.
