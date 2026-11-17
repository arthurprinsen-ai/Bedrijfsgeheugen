# 17 November 2026 — Original daily blog overdue-PR self-reconciliation
Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Related commercial P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Owner: original hourly Powerhouse daily blog from Supabase GitHub workflow.

## Observed trigger
- Original 15 and 16 November blog obligations remained APPROVED, without LIVE_PROVEN.
- Original PR #5833 (15 November) was OPEN and behind main; Required had previously succeeded on an older head.
- Original PR #5918 (16 November) was OPEN and behind main; Required failed on three legal review expiries, which were subsequently genuinely corrected by the original legal owner on main.
- The hourly publisher only considered the current-day candidate for branch convergence and proof; older PRs remained open.

## Proposed change — original owner only
After its existing same-day publication/proof attempt, the SAME hourly workflow executes a bounded pure helper and requests at most ONE native GitHub branch update per scheduled run. Its target must be an original-owner open PR with a branch of form automation/powerhouse-blog-YYYY-MM-DD, same repository, main as base, previous date within 14 days, and exact unchanged head SHA. Before any write the existing service-role read-only Supabase lookup MUST find exactly one original canonical blog obligation in APPROVED status with an actual approved_at and NO published_at, live_proven_at or external_id. Anything else, including absent authorization or a published historical page, fails closed or skips. The only allowed write after this gate is GitHub PUT /pulls/{number}/update-branch with expected_head_sha. It neither merges nor publishes; normal protected CI/CodeQL and auto-merge decide. Conflicting, moved, foreign, unknown or already clean heads are not rewritten. Provider errors fail the existing step and can be detected by the existing observer.

No extra scheduler, agent, queue, author, paid provider or publisher was added. Date/window/idempotency gates, blog editorial/privacy approval, original workflow concurrency, immutable release and public proof remain intact.

## Acceptance
1. Test tests/brain-blog-stale-branch-recovery-20261117.test.mjs passes in exact-head CI.
2. Original Required, CodeQL, protected merge and Netlify source parity succeed on the final PR SHA.
3. Next original scheduled hourly run independently proves a native GitHub update or a valid no-op and rerun of existing candidate CI. No arbitrary force-push.
4. Original approved blog receives public HTTP and exact canonical HTML proof with Supabase LIVE_PROVEN and named ONE BRAIN consumer PROCESSED. A PR or HTTP202 is not a published article.

Further durability: errors on missing distinct LinkedIn personal-source facts, original Mira media provider constraints and SEO/CRO measured outcomes remain with their original owners and cannot be overridden by this blog-specific change.
