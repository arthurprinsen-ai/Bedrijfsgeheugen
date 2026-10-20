# P0 #4198 — reduce revenue evidence HTTP fan-out without data loss

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Related portal: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Date: 2026-10-20

## Observed provider evidence
Netlify request details confirm actual scheduled function invocations at 14:01:18 and 14:02:44 UTC; both ended HTTP499 after ~14.99s. The function calls the existing Supabase revenue-learning-store individually for each candidate. Direct PostgreSQL readback shows 134 unique tenant-canonical evidence rows, 111 recently updated: outcomes are genuinely being persisted, but a whole scheduled run is not terminally proven.

## Existing-authority change
- Introduce bounded atomic `upsert_evidence_batch` of 1–50 unique evidence identifiers inside the existing service-token-only revenue-learning-store Edge Function. Existing tenantId and uniqueness `(tenant_id,evidence_id)` remain authoritative.
- Add `upsertEvidenceBatch` to the existing Netlify store adapter using its fail-closed gateway, retaining `upsertEvidence` for compatibility.
- Process **all** candidates without truncation in 50-row slices. Full provider acknowledgement is required before incrementing `projected`.
- On failed or partial acknowledgement, record a single OPEN obligation for that exact batch with all evidence IDs, fingerprinted by SHA-256; leave source candidates intact so the existing hourly run retries idempotently. Never signal HTTP204 when projected != total; explicit HTTP503 instead.
- No new scheduler, CRM provider, outbound channel, fake attribution, user permission or alternate data store.

## Remaining acceptance
The candidate is **only on a GitHub branch**, not a PR nor live. A new Git-connected Supabase Preview can incur an additional $0.01344 per hour and requires per-branch user cost authorization. Required CI / CodeQL / preview, protected merge, exact Supabase & Netlify source parity, volume/catch-up test, actual provider receipt readback, two-tenant lineage and hourly scheduler completed-without-499 proof remain mandatory. This candidate should not be counted green before all required tests pass.
