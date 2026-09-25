# Netlify OIDC proxy 401 → Git-source fallback

The exact-source production workflow can successfully obtain an OIDC bridge response while still receiving HTTP 401 on the subsequent Netlify upload. This is a transport-authentication defect.

Recovery contract:
1. Preserve current protected main as source authority.
2. Trigger a bounded real website-source change so the linked Git integration performs the production build.
3. Require production commit_ref to equal the resulting protected-main SHA.
4. Verify homepage, pricing and systems/koppelingen plus NL/EN state change in production.
5. Keep the transport failure recorded for later bridge repair; do not mask it as application success.
