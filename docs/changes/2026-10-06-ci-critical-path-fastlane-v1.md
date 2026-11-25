# CI critical-path fast lane v1

## Change
- Removes duplicate Netlify build-parity ownership from `.github/workflows/required-test.yml`; the canonical website lane remains the pre-merge build-parity authority.
- Adds change-scoped Supabase provider preview verification inside the canonical Required test aggregate for database-relevant `supabase/**` changes.
- Keeps edge-function-only Supabase changes off the hosted database-preview path.
- Updates regression coverage so duplicate Netlify build ownership cannot silently return.

## Safety
The protected `test` gate remains fail-closed. Supabase provider verification is moved before any later branch-protection cleanup; it is not deleted. Production readback and post-merge terminal proof remain unchanged.

## Expected effect
Fewer runners and fewer repeated builds per PR, reducing exact-head cycle time and avoiding unnecessary provider waits on unrelated changes.
