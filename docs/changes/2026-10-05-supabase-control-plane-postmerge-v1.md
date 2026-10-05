# Supabase #3742 control-plane post-merge hardening

Two control-plane defects surfaced after the trusted repair workflow was protected-merged.

1. Supabase Preview Applicability passed the complete GitHub check-runs payload through an environment variable. Large checksets hit the operating-system argument/environment limit before provider proof could be evaluated. The workflow now downloads the JSON to a temporary file and Node reads that file.
2. The supported migration-repair workflow could fail on absent production credentials before creating any artifact. It now writes immutable preflight evidence after allowlist/effect validation and before credential validation.

Provider semantics are unchanged: only the Supabase-owned exact-head preview is accepted as replay proof, and production migration tracking may only change through supported `supabase migration repair --status applied`.
