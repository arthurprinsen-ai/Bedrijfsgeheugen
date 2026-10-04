# 2026-10-04 — LinkedIn channel-role learning v1

- Fingerprint: `powerhouse|linkedin-channel-role-learning|v1`
- Root cause: weak absolute social outcomes were promoted to winning lessons; LinkedIn personal/company evidence was not explicitly separated in the lesson compiler.
- Runtime repair applied directly to canonical Supabase function `public.bg_content_lessen()`.
- Readback: 92 measured posts; new `linkedin-channel-role-evidence-v1` active; slot-question and click lessons downgraded from false-positive winners.
- Repository closure: migration + regression + Brain learning + human change doc + ledger.
- Scheduler: reused existing `bg-content-lessen`; no parallel cron introduced.
