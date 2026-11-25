# LinkedIn setup: type the result object

The setup function assigns resume and publisher fields after the result literal was created, which deno check rejects. The result is typed as Record<string,any>. No runtime behaviour changes.

## Validation

`node --test tests/brain-linkedin-setup-result-type-20261028.test.mjs` and `deno check` on the function.

## Boundaries

Does not fix the Supabase preview bundling failure that affects several branches on 2026-10-28; that is a platform-side question.
