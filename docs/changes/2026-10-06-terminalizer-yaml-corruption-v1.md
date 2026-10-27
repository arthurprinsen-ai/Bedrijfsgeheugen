# Terminalizer workflow corruption recovery

PR #3821 fixed the intended Supabase migration-history routing semantics but its workflow edit corrupted the YAML run block. GitHub exposed the defect as a zero-job failed workflow on merge SHA `3804307006a0e716413b319cac6a340beceac92f`.

This recovery restores `.github/workflows/powerhouse-obligation-terminalizer.yml` from the last valid pre-merge blob, reapplies only the canonical obligation-family classifier and bounded Supabase evidence-path allowlist line-by-line, and adds a regression asserting that the critical terminalizer steps occur exactly once.
