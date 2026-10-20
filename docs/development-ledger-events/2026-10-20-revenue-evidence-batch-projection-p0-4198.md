# Powerhouse canonical recovery ledger — 2026-10-20 revenue batch

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Related-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: commercial|bounded-revenue-evidence-projection|20261020
Delivery-Lane: backend
Candidate-Type: recovery
Base-SHA: 7664ef5251ad7974574a1097e93dd747588f38f7
Scope-Budget: 7
Status: SOURCE_ONLY_CANDIDATE / NOT_LIVE

Two production scheduled Netlify function HTTP499 requests lasting 14.99s were provider-confirmed. Unique canonical evidence upserts already persist but cause per-row HTTP amplification. Scoped code adds a bounded 50-item Edge batch using unchanged source credentials and tenant isolation, distinct batch failure obligations and truthful terminal status. Existing hourly executor preserved. Five source and quality files plus documentation/learning, no separate system. 

Acceptance: local test, Required, CodeQL, approved Supabase preview (cost must be authorized before opening a new PR), exact protected merge, provider source deploys, 134+ real evidence records caught up without duplication, no 499 at scheduler clock, and full tenant/provider/end-to-end portal receipts. No assumption of green for the larger incident.
