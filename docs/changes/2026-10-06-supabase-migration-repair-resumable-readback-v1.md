# Resumable Supabase migration repair readback

The #3742 trusted repair control now tolerates transient provider connectivity without weakening mutation safety.

- `supabase migration list` is read-only and gets at most three bounded connection attempts.
- The repair mutation itself is never automatically retried.
- Pre-repair state may be only one of two states: the exact four allowlisted local-only baselines, or zero drift.
- Exact four drift executes the supported repair once.
- Zero drift means a prior repair already landed and the workflow resumes directly at post-repair verification.
- Post-repair/readback must still prove zero drift before #3766 can be advanced.
