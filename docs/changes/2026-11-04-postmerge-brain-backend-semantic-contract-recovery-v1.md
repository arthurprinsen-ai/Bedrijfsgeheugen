# Original BRAIN post-merge backend assurance — 4 november 2026

## Context and distinct proof classes
- Portal UX PR #5399: Required #41804345290 PASS; CodeQL #41804345310 PASS; protected merge `481fbf260896cdb961b45204013214bf363fb044`.
- Netlify original published production deploy `6aeaf5d92bbce3a89d7c2263`, READY, exact commit `481fbf260896cdb961b45204013214bf363fb044`, published 2026-11-04 09:09:12.610 UTC.
- Original post-merge BRAIN run [#41804969879](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804969879): backend 11 failures in five test files, Portal PASS, Automation PASS. Original terminal closure [#41804876879](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41804876879) FAILED because backend BRAIN failed. End-to-end BRAIN closure is **not** green, although the Portal release was published.
- Canonical ONE BRAIN failure fingerprint `github|brain|postmerge-backend-regression|20261104-v1` recorded with source run and job evidence.

## Actual causes, not cosmetic test removal
1. CI admission failure expected fingerprint to derive only from GitHub provider error. Current original hardening preserves first-time-right fingerprint precedence with the *same* typed GitHub classifier fallback. Test now asserts both.
2. Structured OpenAI generation's bounded retry has an explicit per-channel low-reasoning argument; the original quality/schema/final-copy protections remain.
3. Incident skill `powerhouse-current-main-reconstruction` now contains the canonical incident marker but the visible policy still listed it as debt. Remove **only that exact** stale baseline entry, reducing admitted debt.
4. Both original personal-story source-history queries intentionally use **30 distinct preceding calendar days** (instead of the original 7-day fixture) with exact bound tenant, channel and published/proven statuses; the expanded anti-repetition contract is stricter. New test executes the real SQL boundary for multiple dates including 2024 leap day and year change. Do not reduce the source lookback.
5. The original personal editorial bounded retry calls the same governed OpenAI model with low reasoning, and prompt has the same 150–175 word limit expressed with updated Dutch wording. Assert the real bounded callback and wording, while preserving source truth, independent editorial rejection, no new publisher, and no fabricated outcomes.

## Closure
Retain exact-head Required, CodeQL, original full BRAIN and post-merge Terminal Closure; run independent Netlify exact published SHA and any required authenticated end-user behavior. **No waiver, no mock checks, no parallel executor, no synthetic provider evidence.** Keep the previous failure independently visible until a successful genuine original BRAIN rerun plus terminal-close provider readback.
