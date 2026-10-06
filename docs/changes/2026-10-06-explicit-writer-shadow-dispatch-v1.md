# Explicit writer Shadow dispatch — 2026-10-06

Repository Writer Candidate Shadow no longer starts on every pull request. All seven repository writers now dispatch it explicitly after their candidate PR exists, using immutable PR/base/head/branch identity.

This removes a skipped GitHub Actions run from ordinary PRs without weakening writer verification. The existing writer-shadow regression now fails if a global PR trigger returns or if any writer stops dispatching Shadow explicitly.
