# Supabase Edge API source readback v1

Date: 2026-10-06

The production authority previously used the default `supabase functions download` path for provider parity. After the read-only scoped PAT was installed, authentication succeeded but the local ESZIP extraction produced an `index.ts` that differed from protected main even though the official Supabase function source was byte-identical.

The authority now forces `supabase functions download --use-api`. This keeps the PAT read-only, keeps Supabase GitHub Integration as the sole production writer, and moves unbundling to Supabase's server-side API path before byte-for-byte comparison.

Local Docker/ESZIP extraction is no longer accepted as terminal provider-source evidence.
