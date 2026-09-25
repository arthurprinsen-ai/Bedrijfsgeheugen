# 2026-09-25 — closed force-pushed PR recovery governance

- Original PR: #2954.
- Recovery PR: #3093.
- Recovery condition: GitHub refused reopen because the original head branch was force-pushed/recreated.
- Current-main reconciliation: intended Netlify fallback already existed on `ccb64428be9ce5bb05b4e38801475d48e2ea6f28`.
- Stale branch disposition: not merged; recovery PR closed to prevent rollback.
- Production proof: Source Snapshot run `36168441792`, deploy `6ab6b1b1e1aeb600082e5a0b`, exact SHA proven.
- Functional proof: `PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN`.
- Prevention rule: `RECONCILE_CLOSED_FORCE_PUSHED_PR_AGAINST_CURRENT_MAIN`.
- Skill fingerprint: `delivery|pr-recovery|closed-force-pushed-head|v1`.
