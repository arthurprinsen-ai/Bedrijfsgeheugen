# Daily growth measurement must fail closed

The existing daily Content growth learning workflow now validates provider truth rather than mere presence of a source status. A missing Supabase token, provider API failure, empty social payload or absent source-quality coverage must produce a failed job and an explicitly preserved diagnostics artifact, not a green learning outcome. This does not create a new scheduler, connector, database or publishing lane. The authorized owner remains the original 04:20 UTC GitHub workflow and canonical Supabase runtime.

The gate accepts only the explicit provider-observed state with nonempty owned-brand content and source-quality observations. It does not require nonzero likes/comments, assume a known commercial uplift or treat a partially scoped LinkedIn reaction metric as complete impressions. A successful test/merge is not evidence that real provider access works; the scheduled production artifact must establish that independently.

Tests: `node --test tests/brain-daily-provider-proof-gate-v1.test.mjs`, Required and CodeQL.
