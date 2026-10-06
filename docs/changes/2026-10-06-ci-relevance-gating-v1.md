# CI relevance gating v1

## Problem

Pull requests were paying for heavyweight CI even when the changed files could not affect the corresponding runtime surface. CodeQL analyzed every pull request and Supabase Preview Applicability performed a repository checkout before it knew whether any `supabase/**` file had changed.

## Structural change

- Powerhouse CodeQL keeps its pull-request workflow visible, performs a cheap changed-file applicability step, and runs JavaScript/TypeScript analysis only when JS/TS, dependency, or CodeQL workflow files changed.
- Supabase Preview Applicability checks the PR file list before checkout. Non-Supabase changes finish immediately; database-relevant Supabase changes still use the existing exact-head provider proof.
- The existing critical-path regression contract verifies both fast paths.

## Safety

Required workflows are not removed and provider/security gates are not bypassed. Relevant surfaces still take the full verification path.
