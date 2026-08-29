# 2026-08-29 — PRODUCTION_PROMOTION — V18.8 website

- **Fingerprint:** `production|v18.8|exact-sha-promotion`
- **Candidate:** `16ad3dbdd84f82a40db93f6549b94aa3e337d0f9`, reconciled against base `ba415aff138deb2b2ea2600d94962353078aae81` after concurrent `main` documentation drift.
- **Candidate gates:** Shared Agent Memory `33251403264`, Configuratiewacht `33251403311`, V18 Production Promotion `33251403259`, Live Preview Smoke `33251403315`, and Pagina- en SEO-controle `33251403273` all completed successfully on the exact candidate.
- **Promotion:** PR #162 merged guarded on exact head to `main` SHA `0b284a8b45d19a39a3943149dd17f6c0e6efd581`.
- **Production deploy:** Netlify deploy `6a92ca675fac5300088ab395`, context `production`, state `ready`, exact `commit_ref=0b284a8b45d19a39a3943149dd17f6c0e6efd581`.
- **Production verification:** Configuratiewacht `33251534549` and Pagina- en SEO-controle `33251534594` completed successfully after merge; public `https://www.bedrijfsgeheugen.nl` smoke loaded successfully.
- **Protected evidence:** 68 redirect rules and 16 header rules processed; 3 functions and 1 edge function deployed; 676 files secret-scanned; 0 matches.
- **Release content:** verified V18.8 website with deterministic local hero media, synchronized desktop/mobile menu state and one production/deploy-preview build path.
- **Last-known-good before promotion:** `ba415aff138deb2b2ea2600d94962353078aae81`, Netlify `6a92c9a3ebd6570008124a11`.
- **Rollback:** not required. If protected smoke/regression regresses, restore the last-known-good tree while preserving history.
- **Shared learning:** mirrored to Powerhouse Direct Knowledge Base as `PRODUCTION_PROMOTION — V18.8 Website`.
- **Reusable lesson:** release identity is the immutable candidate SHA plus exact production `commit_ref`; any concurrent `main` drift requires re-verification of the reconciled head before guarded merge.
