# POWERHOUSE development ledger — CSRD/ESRS official law source gate

- **Parent obligation:** P0 #4215. **Candidate PR:** #4233. **Artifact:** official EU legal reference gate on the existing Portal V2 regulatory trace.
- **Starting production evidence:** PR #4231 previously merged, source public portal tests green; live Supabase read-only SQL on 2026-10-09 found one Supabase auth user and one portal state tenant, but three Brain tenant keys. This is **not** proof of two genuinely authenticated customer sessions.
- **Observed Brain data:** 911 records; 577 CurrentState; 0 BusinessInput; all 911 source_revision non-null; two outbox records with delivered_at populated. This is not a customer write/ACK/roadmap proof.
- **Legal evidence:** Directive (EU) 2026/470 and Delegated Regulation (EU) 2026/1563, with the new-year thresholds and applicability review always undecided until company-specific legal evidence.
- **Change paths:** portal-v2/csrd-legal-source-gate.js, portal-v2/regulatory-context-trace.js, tests/brain-p0-4215-csrd-official-legal-source-v1.test.mjs.
- **Acceptance:** exact-head Required/CodeQL + Netlify customer-safe readback; parent #4215 open for authenticated A/B, dynamic form matrix, outbox durability and law-specific customer legal proof. No duplicate authority, fake tenant, or unconditional green status.
