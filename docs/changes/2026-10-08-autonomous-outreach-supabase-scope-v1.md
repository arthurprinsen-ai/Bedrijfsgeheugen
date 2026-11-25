# Restore canonical Supabase Edge scope for autonomous outreach

The Edge production authority on main `66912d757598d4430c186a2cff7a0c3041c0b7a3` rejected `powerhouse-autonomous-outreach` with `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG`. This function already exists and has a dedicated server-side scheduler token check. The fix declares it once in `supabase/config.toml` (with the existing custom scheduler-token authentication, therefore `verify_jwt=false`) and adds the executable regression `tests/brain-autonomous-outreach-supabase-scope.test.mjs` for both scope classification and the auth-before-send invariant.

No new outreach is authorized by this change. No credentials are added. Successful dispatch remains subject to the existing token, suppression and provider-confirmed readback protections. Production deployment evidence is required after merge; do not confuse a declared function with a delivered external email.
