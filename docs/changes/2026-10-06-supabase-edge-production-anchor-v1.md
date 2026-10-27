# Supabase Edge production deployment anchor v1

Date: 2026-10-06

Manual authority dispatches run on the current protected-main SHA. Unrelated main commits correctly receive only a skipped Supabase Preview check for the preview integration, so requiring a production check on that exact SHA can wait for evidence that will never exist.

The authority now resolves production provenance fail-closed:

- use a successful production Supabase check on the current SHA when present;
- otherwise inspect a bounded recent history of commits that touched `supabase/config.toml` or one of the selected function trees;
- accept only a successful production check whose commit is source-equivalent to current main across that complete runtime scope;
- observe the same successful check twice;
- then require current provider source to match current main byte-for-byte using `supabase functions download --use-api`;
- finally prove no newer Supabase runtime change superseded the dispatch SHA.

This does not add a deploy path. Supabase GitHub Integration remains the sole production writer.
