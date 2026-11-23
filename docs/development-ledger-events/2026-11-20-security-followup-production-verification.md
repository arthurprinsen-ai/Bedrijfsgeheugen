# Security follow-up — PW Coach + Bedrijfsgeheugen

Audit date: 2026-11-20. Existing original owner: Security Operations Proof / website delivery; no new autonomous executor, scheduler or Make workflow.

## Independent live evidence

The production browser opened `https://www.bedrijfsgeheugen.nl/` and successfully verified:
- HTTP 200 for the public homepage, `/portal-v2/` and `/assets/kop.css`.
- HTTP **404** for previously exposed internal SQL migrations, security CI scripts, internal configuration/learning documents, `/package.json` and `/tools/ci/netlify-build-entry.mjs`.
- HTTP **404** for `/netlify.toml`, `/_headers`, `/_redirects`, `/.gitignore`, build metadata and internal `/supabase/functions/` paths. Netlify protected some of these implicitly, but this security patch additionally enforces 404 for known metadata in the original `_redirects` rules.
- Enforced public baseline CSP: `object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests`; a stricter script CSP is currently **report-only** to preserve existing application scripts and OAuth integrations. HSTS, nosniff and same-origin framing restrictions are active.
- A historical pre-containment Netlify deploy preview URL was redirected to Netlify **team protection** rather than serving a previously exposed SQL file anonymously. This is evidence of protection for that tested historical URL only; it is not exhaustive coverage of all caches, forks or previously retrieved source.

The production browser independently opened `https://pw-mo14-1.netlify.app/zaalplanner/`:
- `/`, `/zaalplanner/` and `/veldplanner/` all returned HTTP 200 with CSP, HSTS, `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- Both coach routes enforced an exact inline-script SHA-256 hash, `script-src-attr 'none'`, no `unsafe-inline` JS or `unsafe-eval`, `object-src 'none'`, `base-uri 'none'` and `frame-ancestors 'none'`.
- The browser inserted a **harmless inline test script** that would set a local boolean; browser policy blocked it and issued exactly one `securitypolicyviolation` event. The normal app continued to render. No penetration or production exploitation test was performed.

Supabase project `adhjwmvyoixzjtmiroln`, read-only catalog/advisors:
- `public.pw_opstellingen` and `public.pw_beoordelingen`: RLS enabled, no policies, `anon`/`authenticated` have no SELECT/INSERT/UPDATE/DELETE grants. These youth-data tables cannot be read or written with ordinary public credentials.
- 188 `RLS Enabled No Policy` findings were `INFO`, indicating deny-by-default, **not** proof of a leak.
- Exactly one `WARN`: `public.powerhouse_external_cron_reconcile_v1(p_token text)` is a deliberate public `SECURITY DEFINER` RPC with explicit `anon` EXECUTE grant, minimum 40-character bearer token and SHA-256 equality against a protected credential digest. This gate is bounded to existing 20-minute/50-failure reconciliation; no anonymous privilege-escalation or token leakage is demonstrated. **Residual risk** remains: a publicly callable privileged function should migrate to a dedicated authenticated server-only caller, then have its anonymous execute grant revoked. Do **not** revoke first and break the existing external cron.

## Source changes in this follow-up PR

1. Add explicit `404!` for Netlify config, Git metadata, editor/devcontainer metadata and generated prebuilt publish metadata at the top of the original `_redirects`, **before** all public routes.
2. Extend the existing source-exposure Node regression to assert each new path is forcibly denied without blocking `/assets/`, `/data/`, `/portal-v2/`, public pages or `/.netlify/functions/`.
3. Extend **existing weekly** Security Operations Proof production check with extra forbidden paths; no new tasks or schedulers.
4. Preserve the installed PW source-hash CSP and Supabase deny-by-default policies; do not alter secrets, user sessions, account permissions, DDL or provider credentials in this patch.

## Production/terminal boundary

Already verified in production: existing P0 source containment, scoped PW CSP, BG baseline CSP, protective PW Supabase RLS. **Not yet independently verified after deployment**: the newly added explicit deny directives in this PR; require protected merge plus new Netlify CURRENT/READY deployment and live HTTP readback of the additional paths before calling these particular safeguards live.

Remaining work: replace `publish = "."` with an audited, allowlisted static output in a separately protected rollout; enforce full Bedrijfsgeheugen script CSP after browser/OAuth compatibility migration; migrate the public privileged cron RPC to server-only auth and retire the anonymous EXECUTE grant; review all historical caching and public exposure disclosures. A public PW coach site shows team/player information without a site login; enabling access control is a separate user-visible product/privacy decision. No site can be guaranteed immune from every attack.

## Public GitHub repository boundary — verified 2026-11-20

GitHub's repository metadata for `arthurprinsen-ai/Bedrijfsgeheugen` explicitly reports `private=false` and `visibility=public`. Netlify `404!` rules protect the public **website** routes but do not conceal source files, commit history or repository content on GitHub itself. No plaintext credential exposure has been demonstrated by this check. If internal code, tenant references or engineering documentation must be confidential, transitioning the repository to private requires an explicit decision and verification of existing CI, GitHub Apps, Netlify and collaborators; it is not safe to silently change access in this patch. Independently audit public repository history and enable GitHub secret scanning/push protection in account settings where supported. Do not claim that HTTP 404 implies source confidentiality from GitHub.
