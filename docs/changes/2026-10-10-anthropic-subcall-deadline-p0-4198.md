# P0 #4198 — Anthropic internal deadline vs supervised generation

Actual 10 October production health rows for the existing content orchestrator show `artifact-ai:Signal timed out.` at 08:35, 08:39 and 08:44 UTC. The child Anthropic `fetch` aborts after 45s although the content supervisor (v36) now allows 75s. This is a distinct root cause from the original controller deadline and explains why safe duplicate rematching still did not yield a live LinkedIn post.

Increase ONLY the already-approved Anthropic tool-use deadline to 90s and existing supervisor child call budget to 110s. Keep backup Composio timeout unchanged at 45s, and reduce social maximum response tokens to 1800 (one post, not a long article). Retain 4800-token blog budget, one generation per tick, content authority checks, personal journey truth, global uniqueness, same lease, provider idempotency and exact readback.

No artificial posts, bulk DMs, doubled scheduler, additional provider credits or safety gate bypass. Evidence remains partial until live provider publication and public URL readback.
