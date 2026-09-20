# Admin Composio key onboarding

Fingerprint: `admin-composio-key-onboarding-v1`.

The existing Powerhouse admin boundary now owns Composio onboarding:
1. Netlify Identity authenticates the user.
2. `isPowerhouseAdmin` enforces the existing admin-only policy.
3. Netlify forwards server-to-server with `x-bg-service-token`.
4. Supabase validates the submitted project API key against Composio before storage.
5. A narrow service-role-only RPC writes only `COMPOSIO_API_KEY` to Vault.
6. The setup controller can then create the hosted Instagram Connect Link.

The API key is never returned, logged, written to Brain, GitHub, Netlify source, localStorage or sessionStorage.
