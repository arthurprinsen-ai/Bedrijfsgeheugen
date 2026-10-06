# Writer shadow explicit dispatch — 2026-10-06

Repository Writer Candidate Shadow no longer listens to every pull request. All seven canonical writer workflows now dispatch it explicitly with immutable PR number, base SHA, head SHA and candidate branch.

This removes one skipped workflow allocation from ordinary PRs while preserving the same writer verification and central writer-gate handoff.
