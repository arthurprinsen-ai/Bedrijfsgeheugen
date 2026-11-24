# Security incident: PW missing production CSP after direct upload; Bedrijfsgeheugen verification
Date: 2026-11-20 · Scope: existing PW MO14 Netlify site + existing Bedrijfsgeheugen production and Supabase.

## Incident and impact
- The existing PW provider deploy `6b003721ccd464e932bd05a5` (2026-11-20 12:03 UTC) contained two changed HTML files but **no Netlify header rules processed**. A later provider deployment `6b00bde12906b94471608077` (21:38 UTC) likewise reported **No header rules processed**.
- An independent production browser **HEAD** to `/zaalplanner/`, `/veldplanner/` and `/` returned no `Content-Security-Policy`, `X-Frame-Options` or `X-Content-Type-Options`. The HSTS header alone was insufficient. This is a security regression, not proof of an attack or data exfiltration.
- Root cause: direct site uploads replaced HTML but omitted the generated `_headers` file, bypassing the existing canonical GitHub Actions -> Netlify deployment sequence. The original coach and the preserved legacy PW homepage share a browser origin and browser storage; their protection must be checked independently.

## Containment — independently verified
- Re-authorized the **existing** scoped Netlify publish capability, stored sealed through GitHub Actions' public-key encryption (no plain secret in source), then dispatched the existing `mo14-zaalplanner-direct-netlify.yml` workflow; no Make.
- GitHub workflow run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44828504809 — **SUCCESS**.
- Provider deploy `6b00c8672aea33df756175fd` published 2026-11-20 22:23:43 UTC: **READY**, Netlify summary explicitly says **4 header rules processed**.
- Independent browser re-read on the exact production URLs proved the zaal and veld routes now include hashed `script-src`, `script-src-attr 'none'`, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `no-store`. The legacy root likewise has `script-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `noindex` and `no-store`.
- This proves the HTTP headers on those specific routes; it is **not** an application penetration test, complete XSS proof, MFA audit or confirmation of no security incident.

## Bedrijfsgeheugen independent checks
- Production `https://www.bedrijfsgeheugen.nl/`: HTTP 200, public assets and portal HTTP 200.
- Formerly exposed repository artifacts including `/supabase/migrations/20261014124402_scoped_external_reconcile_auth_retry_20261014.sql`, `/scripts/security-operations-proof.mjs`, `/package.json`, `/netlify.toml`, `/config/brain-delivery-system.json` and `/.git/config` now return HTTP 404 on production. Historical exposure is not undone by containment, and archived/cached copies require separate evaluation.
- Existing production security headers: HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`, enforced CSP for `object-src`, `base-uri`, `frame-ancestors`; script-src restrictions are **report-only** pending page-specific inventory, to avoid breaking inline legacy behavior. Do not mark strict global anti-XSS CSP as completed.
- Existing CodeQL security-extended (JS/Python) and Dependabot weekly remain in place.

## Supabase authority audit (read-only)
- Postgres catalog: 208 `public` base tables; all have RLS enabled. Six tables have at least one anon privilege, fourteen have at least one authenticated privilege, and **zero** public tables combine missing RLS with client-role grants.
- Security Advisor: 188 INFO `rls_enabled_no_policy` findings, which typically deny client access, not a data leak by themselves; 1 WARN `anon_security_definer_function_executable` on `public.powerhouse_external_cron_reconcile_v1(p_token text)`.
- SQL definition confirms the privileged cron RPC checks a private, SHA-256 token digest and minimum length before proceeding, with a 15-second statement timeout. The anon execution grant is deliberate for an external cron caller. Revoking it unconditionally would break a production integration. Track a migration to authenticated server-to-server invocation, provider readback and safe revocation; no token/credential value was retrieved, exposed or documented here.

## Prevent recurrence — existing mechanism only
- This change extends `.github/workflows/security-operations-proof.yml` rather than introducing another scheduler: keep existing Monday 05:17 UTC full closure; add recurring light HTTP checks at 01:47, 07:47, 13:47 and 19:47 UTC.
- Monitor four real origin boundaries: Bedrijfsgeheugen public home, PW legacy root, PW zaal, PW veld. Fail closed on missing strict CSP/hash, downgraded root outbound policy, missing `nosniff`, framing, cache or robots headers.
- Retain the existing source-exposure 404 proof in that same recurring workflow. Keep the full DR/IAM closure gate weekly, since those obligations are still unproven and should not mask daily CSP regression status.
- Code/contract tests guard monitoring coverage and allow PR validation before protected merge. **These recurring changes are not active on the default branch until this security PR passes checks and is merged.**

## Remaining obligations
- Ensure every future publisher (including direct API uploads) includes generated `_headers`. Read-only monitoring can detect a bad upload but cannot prevent a privileged actor from bypassing the original pipeline.
- Complete stronger Bedrijfsgeheugen per-route script CSP rollout, auth/IAM/MFA review, actual rate limiting on public APIs, external-cron token-gateway migration, isolated recovery drill, and review of children's roster privacy and shared-origin local storage.
- Follow the original system truth: do not label overall security GREEN or fully hack-proof while these checks or changes remain open.
