# Restore canonical terminal closure YAML and production provider replay

Incident: PR #4143 merged with an invalid GitHub Actions YAML. An unsafe replacement interpreted `$'` in a shell regular expression as a JavaScript replacement suffix, truncating a command and appending ~475 duplicate lines. GitHub refused manual closure replay with HTTP 422 even though the file text still contained `workflow_dispatch`.

The repair reconstructs the workflow from the last valid protected-main version and adds one strictly scoped SQL-migration-only provider readback. Its verified path requires authenticated exact Supabase production migration versions. Mixed changes and Edge Functions preserve their separate controls. The canonical terminal evidence output uses the already supported `github_main` mode only after the Supabase provider check passes; the provider proof remains mandatory. A structural regression checks the workflow trigger, unique job/steps and tail boundary.

Protected merge, GitHub workflow-dispatch registration, official PR #4128 closure rerun, provider readback and durable terminal evidence are required before the issue can be called closed.
