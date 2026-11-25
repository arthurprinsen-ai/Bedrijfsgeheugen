# Netlify active OAuth candidate recovery ledger

Obligation-ID: netlify-active-oauth-candidate-provider-read-20261019
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Failed post-OAuth read-only run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39234783733

2026-10-19 10:04:50Z: Supabase project-scoped Composio API key found two complete ACTIVE Netlify connected accounts out of 50 records. One pinned session selected through the original `.find` path; its read-only project tool returned HTTP400 at 10:04:51Z. The account status/UI changes do NOT establish which specific credential was used or prove that new OAuth works.

Candidate correction: collect bounded eligible contexts; perform read-only provider get-project per context, and require exact site identity before health success or production Netlify write-proxy issuance. Keep GitHub main-only OIDC, existing Vault secret, exact site, fixed tool slug and protected deployment acceptance untouched. Change is subject to canonical Required CI and CodeQL, protected merge, Supabase source readback, read-only authority probe, and actual provider-effect release proof. No unauthorized fallback publish or provider-account mutation undertaken.

Current status: Candidate awaiting production acceptance. P0 remains OPEN.
