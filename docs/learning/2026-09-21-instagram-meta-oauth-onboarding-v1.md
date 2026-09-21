# Instagram Meta OAuth onboarding v1

Fingerprint: `instagram-meta-oauth-onboarding-v1`

Admin entry point: `/portal-v2/powerhouse-instagram-connect.html`.

Flow:
1. authenticated Powerhouse admin stores Instagram App ID + App Secret;
2. app secret is written to Supabase Vault only;
3. admin starts Instagram OAuth;
4. signed short-lived state protects the callback;
5. callback exchanges authorization code server-side;
6. short-lived token is exchanged for a long-lived token;
7. Instagram `user_id` and username are validated;
8. runtime credentials are stored in Vault;
9. daily scheduled refresh keeps the token current.

Required Meta permission scopes:
- `instagram_business_basic`
- `instagram_business_content_publish`

Exact redirect URI:
`https://www.bedrijfsgeheugen.nl/api/powerhouse-meta-instagram-oauth-callback`
