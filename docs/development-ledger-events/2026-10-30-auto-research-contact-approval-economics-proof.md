# 2026-10-30 — append-only economics source split

- Problem: 17 already completed internal auto-research actions were excluded from the original economics backfill because the contact-level `human_approved` flag was true, despite exact independent original automated research receipts.
- Source readback: original materializer `human_approved` derives from contact_extra; executor `powerhouse_execute_relationship_research_v1` records zero vendor and external side effects.
- Proof: all 17 matched independent event receipts. Five salesrobot_linkedin_dm plus two reply_followup economics gaps excluded from this fix. Original function grants anon/authenticated=false, service_role=true.
- Patch: same bounded server-only `powerhouse_backfill_internal_research_economics_v1`; existing no-approval branch unchanged; contact-approved branch strictly gated by exact unique run receipt; no invented provider costs; no extra cron.
- Release contract: protected exact-head Required/CodeQL/System Map and migration authority first; read actual production function definition and next natural original mux pass. Never claim 17 records recovered before real matching economic readback.
- Owner: original Powerhouse Economics / ONE BRAIN; incident #4215.