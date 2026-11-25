# 24 October 2026 — Social learning scope isolation and hourly availability

- Reuse **one** existing `@hourly` Netlify `social-learning-evaluate` function and canonical Supabase post/snapshot/evaluation tables.
- Provider evidence: actual Netlify hourly 20:00 UTC HTTP 204 took 10.2 seconds and processed only 1 measured + 3 missing windows, leaving 488 due; earlier version produced 15-second HTTP 499s.
- Code root cause: loop awaits canonical tenant before brand, so a canonical fault prevents brand evaluation. Introduce concurrent independently bounded scope processing with structured failure isolation.
- Keep 2 due windows per tenant; all tenant IDs validated before fetching; partial failure returns 503 and does **not** misrepresent missing scope as zero backlog.
- No synthetic source data, provider sends, duplicate scheduler, or bypass of a publisher/identity guard. 
- Terminal proof: tests, exact SHA Required and CodeQL, protected merge, Netlify deploy, subsequent hourly provider status and independent Supabase scoped evaluation readback.
