# Development ledger — admin-composio-key-onboarding-v1

- Date: 2026-09-20
- Gap: external Composio project key had no secure canonical onboarding path.
- Boundary: existing Powerhouse admin identity only.
- Storage: Supabase Vault, exact secret name COMPOSIO_API_KEY.
- Validation: live Composio API call before Vault write.
- Writer scope: dedicated service-role-only RPC; no generic secret mutation.
- Browser persistence: forbidden.
