# Terminal closure: provider-specific production proof

On 8 October 2026, run #37760879023 failed waiting for Netlify after PR #4134 changed only a Supabase Edge function. The changed function was absent from canonical `supabase/config.toml`, causing Supabase provider readback to report `NOT_APPLICABLE`.

## Implementation
- Shared release classifier: website, Supabase Edge, mixed, unknown and non-runtime.
- Supabase-only requires ACTIVE provider version and runtime SHA-256, protected-main ancestry and unchanged changed function source; not a Netlify release.
- Website changes retain canonical Netlify release and readiness verification.
- Mixed website/Edge changes require both provider and Netlify readbacks.
- Unknown runtime paths cannot use a Supabase-only fast path.
- Directly modified but undeclared Edge functions no longer disappear from required provider scope; production authority fails closed until registration.
- Existing `powerhouse-composio-linkedin-setup` is registered with its current JWT verification setting.
- Durable Brain evidence and immutable terminal artifact remain mandatory.

## Verified evidence and pending steps
Supabase production `powerhouse-composio-linkedin-setup` was ACTIVE version 24, runtime bundle SHA-256 `686209886761d6a0db3d27cb8bce7fbea80425a6212a7bb9832dd7049531dbc4`. Its live source was byte-for-byte equal to merged PR #4134 and current main at observation. The workflow correction remains **PENDING_PROTECTED_DELIVERY** until exact-head CI, protected merge, provider readback and durable Brain closure succeed.
