# Development ledger — instagram-meta-oauth-onboarding-v1

- Date: 2026-09-21
- Gap: direct Meta publishing was deployed, but activation still depended on manually obtaining and storing external credentials.
- Change: add admin-only Meta app credential onboarding, signed Instagram OAuth start/callback, server-side short→long-lived token exchange, account validation and daily token refresh.
- Security: app secret and access token never persist in browser storage or URLs; Vault writers remain service-role only.
- Permissions: request only Instagram business basic + content publish for the publishing path.
- Recovery: absent/expired credentials remain a fail-closed configuration state; no duplicate publication is authorized.
- Terminal proof: exact-head CI, protected merge, Netlify deployment, Supabase migration/function provider readback and runtime status are required.
